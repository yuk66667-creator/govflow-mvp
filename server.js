require('dotenv').config();
const express = require('express');
const path = require('path');
const { startScheduler } = require('./jobs/dailyJob');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/programs'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/documents'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] GovFlow MVP running on http://localhost:${PORT}`);
  startScheduler();   // ✅ 여기 하나만 남김
});