import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

import { connectDB } from './db.js';
import Transaction from './models/Transaction.js';
import ModelMetrics from './models/ModelMetrics.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing
app.add_middleware = app.use; // align with API docs style if needed, standard Express works
app.use(cors());
app.use(express.json());

// Setup multer for CSV batch uploads
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Global variable for batch exports
let latestBatchCsvPath = null;
let latestPredictionsCsvPath = null;

// Determine python path (check virtual env first)
function getPythonPath() {
  const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
  if (fs.existsSync(venvPath)) {
    return venvPath;
  }
  const venvPathWin = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPathWin)) {
    return venvPathWin;
  }
  return 'python3';
}

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    // 1. Seed Model Metrics
    const metricsCount = await ModelMetrics.countDocuments();
    if (metricsCount === 0) {
      console.log('Seeding model metrics...');
      const metricsFilePath = path.join(process.cwd(), 'app', 'models', 'metrics.json');
      if (fs.existsSync(metricsFilePath)) {
        const rawData = fs.readFileSync(metricsFilePath, 'utf8');
        const metricsData = JSON.parse(rawData);
        
        const documents = [];
        for (const [modelName, data] of Object.entries(metricsData)) {
          documents.push({
            model_name: modelName,
            ...data
          });
        }
        await ModelMetrics.insertMany(documents);
        console.log(`Seeded ${documents.length} model metrics successfully.`);
      } else {
        console.warn(`metrics.json not found at ${metricsFilePath}. Metrics seeding skipped.`);
      }
    }

    // 2. Seed Transaction Records
    const txnCount = await Transaction.countDocuments();
    if (txnCount === 0) {
      console.log('Seeding transaction records from CSV...');
      const csvFilePath = path.join(process.cwd(), 'app', 'data', 'credit_card_transactions.csv');
      
      // If CSV doesn't exist, we can generate it using data_generator.py first
      if (!fs.existsSync(csvFilePath)) {
        console.log('CSV not found. Generating synthetic transactions first...');
        const pythonPath = getPythonPath();
        const generatorPath = path.join(process.cwd(), 'app', 'data_generator.py');
        
        await new Promise((resolve, reject) => {
          const pyGen = spawn(pythonPath, [generatorPath]);
          pyGen.on('close', (code) => {
            if (code === 0) {
              console.log('Synthetic data generation completed.');
              resolve();
            } else {
              reject(new Error(`Data generator failed with exit code ${code}`));
            }
          });
        });
      }

      if (fs.existsSync(csvFilePath)) {
        const records = [];
        let count = 0;
        
        await new Promise((resolve, reject) => {
          fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
              // Convert fields
              const record = {
                TransactionID: row.TransactionID,
                Time: parseInt(row.Time),
                Amount: parseFloat(row.Amount),
                Merchant: row.Merchant,
                Category: row.Category,
                Cardholder: row.Cardholder,
                Class: parseInt(row.Class)
              };
              // Map PCA features
              for (let i = 1; i <= 28; i++) {
                record[`V${i}`] = parseFloat(row[`V${i}`]);
              }
              records.push(record);
              count++;
            })
            .on('end', async () => {
              try {
                // Bulk insert in chunks of 1000
                const chunkSize = 1000;
                for (let i = 0; i < records.length; i += chunkSize) {
                  const chunk = records.slice(i, i + chunkSize);
                  await Transaction.insertMany(chunk);
                }
                console.log(`Successfully seeded ${count} transactions.`);
                resolve();
              } catch (err) {
                reject(err);
              }
            })
            .on('error', (err) => reject(err));
        });
      } else {
        console.error('Failed to create or seed transaction CSV');
      }
    }

    // 3. Seed User
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default admin user...');
      await User.create({
        name: 'Admin User',
        email: 'admin@aegisfraud.in',
        password: 'admin123'
      });
      console.log('Seeded default admin user successfully.');
    }
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
  }
};

// Boxplot helper function
function getBoxplotStats(values) {
  if (values.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  values.sort((a, b) => a - b);
  const min = values[0];
  const max = values[values.length - 1];
  
  const getPercentile = (p) => {
    const idx = (values.length - 1) * p;
    const base = Math.floor(idx);
    const rest = idx - base;
    if (values[base + 1] !== undefined) {
      return values[base] + rest * (values[base + 1] - values[base]);
    }
    return values[base];
  };

  return {
    min: parseFloat(min.toFixed(2)),
    q1: parseFloat(getPercentile(0.25).toFixed(2)),
    median: parseFloat(getPercentile(0.5).toFixed(2)),
    q3: parseFloat(getPercentile(0.75).toFixed(2)),
    max: parseFloat(max.toFixed(2))
  };
}

// Pearson Correlation Matrix helper
function computeCorrelationMatrix(data, features) {
  const n = data.length;
  if (n === 0) return [];
  const means = {};
  const stds = {};
  
  // Compute means
  for (const f of features) {
    let sum = 0;
    for (const row of data) {
      sum += row[f] || 0;
    }
    means[f] = sum / n;
  }
  
  // Compute standard deviations
  for (const f of features) {
    let sumSqDiff = 0;
    const mean = means[f];
    for (const row of data) {
      const diff = (row[f] || 0) - mean;
      sumSqDiff += diff * diff;
    }
    stds[f] = Math.sqrt(sumSqDiff);
  }
  
  // Compute correlations
  const matrix = [];
  for (const f1 of features) {
    for (const f2 of features) {
      let cov = 0;
      const mean1 = means[f1];
      const mean2 = means[f2];
      for (const row of data) {
        cov += ((row[f1] || 0) - mean1) * ((row[f2] || 0) - mean2);
      }
      const stdProduct = stds[f1] * stds[f2];
      const corr = stdProduct === 0 ? 0 : cov / stdProduct;
      matrix.push({
        x: f1,
        y: f2,
        value: parseFloat(corr.toFixed(4))
      });
    }
  }
  return matrix;
}

// Connect DB and seed
connectDB().then(() => {
  seedDatabase();
});

// API Routes

// 1. Health check
app.get('/api/health', async (req, res) => {
  const metricsCount = await ModelMetrics.countDocuments();
  res.json({
    status: 'healthy',
    database: 'connected',
    models_count: metricsCount,
    node_version: process.version
  });
});

// 1.5. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({
      token: 'jwt_admin_session_token',
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.6. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill in all fields (name, email, password).' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }
    const newUser = await User.create({ name, email, password });
    res.status(201).json({
      token: 'jwt_admin_session_token',
      user: {
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Dataset Stats
app.get('/api/dataset/stats', async (req, res) => {
  try {
    const totalRecords = await Transaction.countDocuments();
    const fraudCount = await Transaction.countDocuments({ Class: 1 });
    const genuineCount = totalRecords - fraudCount;
    
    // Aggregation for means, mins, maxs, std deviations
    const aggStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          amountMean: { $avg: '$Amount' },
          amountMin: { $min: '$Amount' },
          amountMax: { $max: '$Amount' },
          amountStd: { $stdDevPop: '$Amount' },
          timeMean: { $avg: '$Time' },
          timeMin: { $min: '$Time' },
          timeMax: { $max: '$Time' },
          timeStd: { $stdDevPop: '$Time' }
        }
      }
    ]);
    
    const statsObj = aggStats[0] || {
      amountMean: 0, amountMin: 0, amountMax: 0, amountStd: 0,
      timeMean: 0, timeMin: 0, timeMax: 0, timeStd: 0
    };

    // Static Column types mapping for completeness
    const columnTypes = {
      TransactionID: 'str', Class: 'int64', Time: 'int64', Amount: 'float64',
      Merchant: 'str', Category: 'str', Cardholder: 'str'
    };
    for (let i = 1; i <= 28; i++) {
      columnTypes[`V${i}`] = 'float64';
    }

    res.json({
      total_records: totalRecords,
      fraud_count: fraudCount,
      genuine_count: genuineCount,
      fraud_percentage: totalRecords > 0 ? parseFloat(((fraudCount / totalRecords) * 100).toFixed(4)) : 0,
      missing_values: 0,
      column_types: columnTypes,
      stats: {
        Amount: {
          mean: parseFloat(statsObj.amountMean.toFixed(2)),
          min: parseFloat(statsObj.amountMin.toFixed(2)),
          max: parseFloat(statsObj.amountMax.toFixed(2)),
          std: parseFloat(statsObj.amountStd.toFixed(2))
        },
        Time: {
          mean: parseFloat(statsObj.timeMean.toFixed(2)),
          min: parseFloat(statsObj.timeMin.toFixed(2)),
          max: parseFloat(statsObj.timeMax.toFixed(2)),
          std: parseFloat(statsObj.timeStd.toFixed(2))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Dataset sample
app.get('/api/dataset/sample', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const samples = await Transaction.find().limit(limit).lean();
    
    // Format response to match FastAPI output structure
    const formatted = samples.map(s => {
      const { _id, __v, createdAt, updatedAt, ...rest } = s;
      return rest;
    });
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. EDA charts
app.get('/api/eda/charts', async (req, res) => {
  try {
    // A. Class Distribution
    const fraudCount = await Transaction.countDocuments({ Class: 1 });
    const genuineCount = await Transaction.countDocuments({ Class: 0 });
    const classDist = [
      { name: 'Genuine', value: genuineCount },
      { name: 'Fraudulent', value: fraudCount }
    ];

    // B. Amount distribution buckets
    // Boundaries: [0, 500, 2000, 5000, 10000, 25000, 50000]
    const bins = [0, 500, 2000, 5000, 10000, 25000, 50000];
    const binLabels = ["₹0-500", "₹500-2k", "₹2k-5k", "₹5k-10k", "₹10k-25k", "₹25k-50k", "₹50k+"];
    
    const rawBucketData = await Transaction.aggregate([
      {
        $bucket: {
          groupBy: '$Amount',
          boundaries: bins,
          default: 50000,
          output: {
            genuine: { $sum: { $cond: [{ $eq: ['$Class', 0] }, 1, 0] } },
            fraud: { $sum: { $cond: [{ $eq: ['$Class', 1] }, 1, 0] } }
          }
        }
      }
    ]);

    // Map buckets to labels
    const amountDist = binLabels.map((label, idx) => {
      const boundaryValue = bins[idx];
      const match = rawBucketData.find(b => b._id === boundaryValue || (idx === binLabels.length - 1 && b._id === 50000));
      return {
        bin: label,
        genuine: match ? match.genuine : 0,
        fraud: match ? match.fraud : 0
      };
    });

    // C. PCA Scatter Plot: 800 samples total (combining 100 fraud + 700 genuine)
    const fraudSamples = await Transaction.find({ Class: 1 }).limit(100).lean();
    const genuineSamples = await Transaction.find({ Class: 0 }).limit(700).lean();
    
    const combinedSamples = [...fraudSamples, ...genuineSamples];
    // Shuffle array
    for (let i = combinedSamples.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedSamples[i], combinedSamples[j]] = [combinedSamples[j], combinedSamples[i]];
    }

    const pcaScatter = combinedSamples.map(row => ({
      id: row.TransactionID,
      x: row.V1,
      y: row.V2,
      amount: row.Amount,
      class: row.Class,
      merchant: row.Merchant
    }));

    // D. Boxplots for Amount (quartiles)
    const genuineAmounts = await Transaction.find({ Class: 0 }, 'Amount').lean();
    const fraudAmounts = await Transaction.find({ Class: 1 }, 'Amount').lean();

    const boxplots = {
      genuine: getBoxplotStats(genuineAmounts.map(a => a.Amount)),
      fraud: getBoxplotStats(fraudAmounts.map(a => a.Amount))
    };

    // E. Correlation Heatmap (11 variables Pearson correlation)
    const correlationFeatures = ["Class", "Amount", "Time", "V1", "V2", "V3", "V4", "V10", "V12", "V14", "V17"];
    const allRecords = await Transaction.find({}, correlationFeatures.join(' ')).lean();
    const correlationHeatmap = computeCorrelationMatrix(allRecords, correlationFeatures);

    res.json({
      class_distribution: classDist,
      amount_distribution: amountDist,
      correlation_heatmap: correlationHeatmap,
      pca_scatter: pcaScatter,
      boxplots: boxplots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Pipeline Steps
app.get('/api/pipeline-steps', (req, res) => {
  res.json([
    {
      step: 1,
      name: "Data Ingestion & Cleaning",
      description: "Loads raw credit card transactions, handles missing features, and scales raw Amount and Time to match distribution requirements.",
      status: "completed"
    },
    {
      step: 2,
      name: "Feature Engineering & Selection",
      description: "Excludes meta columns (Merchant, Category, Cardholder) and preserves Time, Amount, and the V1-V28 PCA features.",
      status: "completed"
    },
    {
      step: 3,
      name: "Train-Test Splitting",
      description: "Splits the input dataset into 80% for training and 20% for validation using Stratified Sampling to preserve class proportions.",
      status: "completed"
    },
    {
      step: 4,
      name: "SMOTE Class Balancing",
      description: "Applies Synthetic Minority Over-sampling Technique (SMOTE) strictly on the training set to resolve the 1.6% fraud class imbalance, increasing minority samples to create a 50-50 class distribution.",
      status: "completed"
    },
    {
      step: 5,
      name: "Multi-Model Fitting & Scaling",
      description: "Fits 6 machine learning models concurrently on the balanced training data and generates evaluation coordinates.",
      status: "completed"
    }
  ]);
});

// 6. Compare models
app.get('/api/models/compare', async (req, res) => {
  try {
    const metrics = await ModelMetrics.find().lean();
    if (metrics.length === 0) {
      return res.status(404).json({ detail: "Model metrics are still training or not loaded." });
    }
    const comparison = metrics.map(m => ({
      model_name: m.model_name,
      accuracy: m.accuracy,
      precision: m.precision,
      recall: m.recall,
      f1_score: m.f1_score,
      roc_auc: m.roc_auc,
      training_time: m.training_time
    }));
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get model evaluation details
app.get('/api/models/evaluation/:modelName', async (req, res) => {
  try {
    const metrics = await ModelMetrics.findOne({ model_name: req.params.modelName }).lean();
    if (!metrics) {
      return res.status(404).json({ detail: `Metrics for model '${req.params.modelName}' not found.` });
    }
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Predict Single Transaction
app.post('/api/predict', async (req, res) => {
  const modelName = req.query.model || 'XGBoost';
  const data = req.body;
  const pythonPath = getPythonPath();
  const bridgePath = path.join(process.cwd(), 'app', 'bridge.py');
  
  // Spawn python bridge to run inference
  const pyProcess = spawn(pythonPath, [
    bridgePath,
    'predict',
    '--model', modelName,
    '--data', JSON.stringify(data)
  ]);
  
  let stdoutData = '';
  let stderrData = '';
  
  pyProcess.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });
  
  pyProcess.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });
  
  pyProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Bridge script failed with code ${code}. Stderr: ${stderrData}`);
      return res.status(500).json({ error: `Inference bridge script failed: ${stderrData}` });
    }
    try {
      const result = JSON.parse(stdoutData.trim());
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      res.json(result);
    } catch (e) {
      console.error(`Failed to parse bridge stdout: ${stdoutData}`);
      res.status(500).json({ error: `Failed to parse prediction result: ${e.message}` });
    }
  });
});

// 9. Predict Batch
app.post('/api/predict/batch', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded.' });
    }
    
    const modelName = req.body.model || 'XGBoost';
    const inputCsvPath = req.file.path;
    const outputCsvPath = path.join('uploads', `predicted_${req.file.filename}.csv`);
    
    const pythonPath = getPythonPath();
    const bridgePath = path.join(process.cwd(), 'app', 'bridge.py');
    
    // Save file references for the export API
    latestBatchCsvPath = inputCsvPath;
    latestPredictionsCsvPath = outputCsvPath;
    
    const pyProcess = spawn(pythonPath, [
      bridgePath,
      'predict_batch',
      '--model', modelName,
      '--csv', inputCsvPath,
      '--out', outputCsvPath
    ]);
    
    let stdoutData = '';
    let stderrData = '';
    
    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });
    
    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });
    
    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Bridge batch failed with code ${code}. Stderr: ${stderrData}`);
        return res.status(500).json({ error: `Inference batch script failed: ${stderrData}` });
      }
      try {
        const result = JSON.parse(stdoutData.trim());
        if (result.error) {
          return res.status(500).json({ error: result.error });
        }
        res.json(result);
      } catch (e) {
        console.error(`Failed to parse bridge batch stdout: ${stdoutData}`);
        res.status(500).json({ error: `Failed to parse prediction results: ${e.message}` });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Export Batch Prediction (CSV or PDF)
app.get('/api/predict/batch/export', async (req, res) => {
  const format = req.query.format || 'csv';
  
  if (!latestPredictionsCsvPath || !fs.existsSync(latestPredictionsCsvPath)) {
    return res.status(400).json({ error: 'No batch predictions available to export. Run batch prediction first.' });
  }
  
  if (format === 'csv') {
    res.download(latestPredictionsCsvPath, 'batch_fraud_predictions.csv');
  } else if (format === 'pdf') {
    const pdfPath = path.join('uploads', `report_${path.basename(latestPredictionsCsvPath)}.pdf`);
    const pythonPath = getPythonPath();
    const bridgePath = path.join(process.cwd(), 'app', 'bridge.py');
    
    // Spawn report generator
    const pyProcess = spawn(pythonPath, [
      bridgePath,
      'export_pdf',
      '--csv', latestPredictionsCsvPath,
      '--out', pdfPath
    ]);
    
    let stderrData = '';
    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });
    
    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Bridge PDF failed with code ${code}. Stderr: ${stderrData}`);
        return res.status(500).json({ error: `PDF report generation failed: ${stderrData}` });
      }
      res.download(pdfPath, 'fraud_analytics_report.pdf');
    });
  } else {
    res.status(400).json({ error: 'Invalid export format. Supported formats: csv, pdf' });
  }
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on port ${PORT}`);
});
