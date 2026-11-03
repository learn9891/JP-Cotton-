const express = require('express');
const path = require('path');
const app = express();
const PORT = 8000;

app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => {
    console.log(`Frontend running on http://localhost:${PORT}`);
});
