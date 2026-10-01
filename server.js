const express = require('express');
const sqlite3 = sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Database opening error: ' + err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            school_name TEXT,
            principal_name TEXT,
            phone TEXT,
            remarks TEXT,
            image TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// 1. MARKETER FORM & LIVE CAMERA PAGE
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>School Visit Tracker</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f9; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h2 { text-align: center; color: #333; }
                label { display: block; margin-top: 10px; font-weight: bold; color: #555; }
                input, textarea { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                video, canvas { width: 100%; border-radius: 4px; margin-top: 10px; background: #000; }
                button { width: 100%; background: #28a745; color: white; padding: 12px; border: none; border-radius: 4px; font-size: 16px; margin-top: 15px; cursor: pointer; }
                button:hover { background: #218838; }
                #capture-btn { background: #007bff; margin-top: 10px; }
                #capture-btn:hover { background: #0056b3; }
                .admin-link { display: block; text-align: center; margin-top: 15px; color: #007bff; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>School Visit Form</h2>
                <form id="visitForm" action="/submit" method="POST">
                    <label>School Name:</label>
                    <input type="text" name="school_name" required>

                    <label>Principal/Contact Person Name:</label>
                    <input type="text" name="principal_name" required>

                    <label>Phone Number:</label>
                    <input type="text" name="phone" required>

                    <label>Remarks / Feedback:</label>
                    <textarea name="remarks" rows="3" required></textarea>

                    <label>Live Camera Capture (Gallery Upload Disabled):</label>
                    <video id="video" autoplay playsinline></video>
                    <button type="button" id="capture-btn" onclick="capturePhoto()">Capture Photo</button>
                    <canvas id="canvas" style="display:none;"></canvas>
                    <img id="preview" style="width:100%; margin-top:10px; display:none; border-radius:4px;" alt="Captured Photo"/>
                    
                    <input type="hidden" name="image" id="imageInput" required>

                    <button type="submit" id="submit-btn" style="display:none;">Submit Visit</button>
                </form>
                <a href="/admin" class="admin-link">Go to Admin Panel</a>
            </div>

            <script>
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const preview = document.getElementById('preview');
                const imageInput = document.getElementById('imageInput');
                const submitBtn = document.getElementById('submit-btn');
                const captureBtn = document.getElementById('capture-btn');

                // Start Live Camera
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
                    .then(stream => { video.srcObject = stream; })
                    .catch(err => { alert("Camera access denied or not available!"); });

                function capturePhoto() {
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const dataURL = canvas.toDataURL('image/jpeg');
                    preview.src = dataURL;
                    preview.style.display = 'block';
                    imageInput.value = dataURL;

                    // Hide video & show submit button once photo is captured
                    video.style.display = 'none';
                    captureBtn.style.display = 'none';
                    submitBtn.style.display = 'block';
                }
            </script>
        </body>
        </html>
    `);
});

// 2. HANDLE FORM SUBMISSION
app.post('/submit', (req, res) => {
    const { school_name, principal_name, phone, remarks, image } = req.body;
    
    const stmt = db.prepare(`INSERT INTO visits (school_name, principal_name, phone, remarks, image) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(school_name, principal_name, phone, remarks, image, (err) => {
        if (err) {
            console.error(err);
            return res.send("Error saving data!");
        }
        res.send(`
            <h2 style="text-align:center; font-family:Arial; margin-top:50px; color:green;">Visit Submitted Successfully!</h2>
            <div style="text-align:center;"><a href="/" style="font-size:18px;">Back to Form</a> | <a href="/admin" style="font-size:18px;">View Admin Panel</a></div>
        `);
    });
    stmt.finalize();
});

// 3. ADMIN PANEL
app.get('/admin', (req, res) => {
    db.all(`SELECT * FROM visits ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            return res.send("Error loading admin data.");
        }

        let rowsHtml = '';
        rows.forEach(row => {
            rowsHtml += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.date}</td>
                    <td><b>${row.school_name}</b></td>
                    <td>${row.principal_name}</td>
                    <td>${row.phone}</td>
                    <td>${row.remarks}</td>
                    <td><img src="${row.image}" width="100" style="border-radius:4px;" /></td>
                </tr>
            `;
        });

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Panel - School Visits</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #f4f4f9; margin: 0; padding: 20px; }
                    .container { max-width: 1000px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h2 { color: #333; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #007bff; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .back-link { display: inline-block; margin-bottom: 15px; color: #007bff; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <a href="/" class="back-link">&larr; Back to Form</a>
                    <h2>Admin Panel - All School Visits</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date/Time</th>
                                <th>School Name</th>
                                <th>Principal</th>
                                <th>Phone</th>
                                <th>Remarks</th>
                                <th>Picture</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || '<tr><td colspan="7" style="text-align:center;">No visits recorded yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
    });
});

app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});
