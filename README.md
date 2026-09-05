# MitraScan AI

MitraScan AI is a web-based compliance audit system for packaged products. It helps inspectors check product labels and public e-commerce listings against important declarations required under the Legal Metrology (Packaged Commodities) Rules, 2011.

The system can read a label image, analyze pasted OCR text, or inspect a public product URL. It produces a declaration-wise compliance result and a downloadable PDF evidence report.

> This is a technology prototype for assisted inspection. It does not replace legal advice or final verification by an authorized inspector.

## Main features

- Secure login and registration for inspectors.
- JWT-based authentication and role-based authorization.
- Product label image upload.
- Image cleanup and orientation correction with Sharp.
- English OCR using Tesseract.js.
- Manual OCR text input for testing and correction.
- Seven declaration checks:
  - Manufacturer, packer, or importer details.
  - Common or generic product name.
  - Net quantity and standard unit.
  - Month and year of manufacture, packing, or import.
  - Maximum Retail Price and inclusive-of-all-taxes wording.
  - Consumer care phone, email, and address/designation.
  - Country of origin.
- Public product URL audit for e-commerce listings.
- Compliance score with pass, warning, and failure states.
- Detected details for every declaration.
- Clear violation/action text for missing or suspicious declarations.
- PDF evidence report generation.
- MongoDB Atlas storage through Mongoose.
- Temporary in-memory storage for local demos when Atlas is not configured.

## Technology stack

### Frontend

- React 19
- Vite
- JavaScript and JSX
- CSS
- Fetch API

### Backend

- Node.js
- Express
- CommonJS modules
- Multer for file uploads
- Sharp for image preprocessing
- Tesseract.js for OCR
- Puppeteer for PDF reports
- JSON Web Tokens for authentication
- bcryptjs for password hashing

### Database

- MongoDB Atlas
- Mongoose ODM

## Project structure

```text
MitraScan-AI/
├── Backend/
│   ├── config/
│   │   ├── database.js       MongoDB connection
│   │   └── env.js            Environment configuration
│   ├── controllers/
│   │   ├── auditController.js
│   │   ├── authController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── auth.js            JWT authentication and role checks
│   │   ├── errorHandler.js    Common API error responses
│   │   └── upload.js          Image upload validation
│   ├── models/
│   │   ├── Audit.js           Audit database schema
│   │   └── User.js            User database schema
│   ├── repositories/
│   │   ├── auditRepository.js
│   │   └── userRepository.js
│   ├── routes/
│   │   ├── auditRoutes.js
│   │   ├── authRoutes.js
│   │   └── healthRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── complianceEngine.js
│   │   ├── ocrService.js
│   │   ├── reportService.js
│   │   └── urlAuditService.js
│   ├── utils/
│   │   └── asyncHandler.js
│   ├── app.js                Express app and route registration
│   ├── server.js             Database connection and server startup
│   ├── package.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── AuditForm.jsx
│   │   │   ├── AuditResults.jsx
│   │   │   ├── RecentAudits.jsx
│   │   │   └── Topbar.jsx
│   │   ├── services/
│   │   │   ├── auditApi.js
│   │   │   └── authApi.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## How the system works

### 1. User authentication

The user registers or signs in from the React interface.

```text
Frontend login form
    -> POST /api/auth/login
    -> Backend validates email and password
    -> bcrypt compares the password hash
    -> Backend creates a JWT token
    -> Frontend stores the token locally
```

The token is sent with every protected API request:

```text
Authorization: Bearer <token>
```

### 2. Image audit

```text
Image selected in browser
    -> Multipart upload to Express
    -> Multer checks file type and 8 MB limit
    -> Sharp rotates and normalizes the image
    -> Tesseract.js extracts English text
    -> Compliance engine checks seven declarations
    -> Audit repository saves the result
    -> React shows the score and findings
```

### 3. OCR text audit

The inspector can paste OCR text directly. This is useful when:

- OCR needs manual correction.
- A separate OCR system has already extracted the text.
- A demo must be tested without a camera image.

The pasted text skips image processing and goes directly to the compliance engine.

### 4. E-commerce URL audit

```text
Public product URL
    -> URL validation
    -> Public HTML fetch
    -> Script/style removal
    -> Readable text extraction
    -> Same compliance engine
    -> Audit result and PDF evidence
```

URL audits are preliminary. A marketplace can use CAPTCHA, login restrictions, regional content, rate limits, or JavaScript-only rendering. The system does not bypass those controls. A clear label image is usually stronger evidence than listing text.

### 5. PDF report

The PDF contains:

- Product name.
- Audit status and score.
- Declaration and status.
- Detected details.
- Applicable legal requirement.
- Violation/action message.
- Source image or source URL.

For a passing declaration, the report shows:

```text
N/A - compliant: declaration detected and no automated issue found.
```

For a failed declaration, it shows a clear violation message and tells the inspector what needs verification.

## Compliance result states

### Compliant

All configured declarations were detected and no automated warning was found.

### Review required

The declaration was partly detected, but a format or wording issue needs human review. For example, the MRP amount may be present but the phrase `inclusive of all taxes` may be missing.

### Non-compliant

One or more required declarations were not detected by the system.

The result is an automated screening result. The original package or listing must always be checked before enforcement action.

## MongoDB Atlas setup

### Create an Atlas cluster

1. Open [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a cluster.
3. Create a database user.
4. Add your current IP address under **Network Access**.
5. Copy the Node.js connection string.

### Create the local environment file

Copy the template:

```powershell
cd Backend
Copy-Item .env.example .env
```

Open `Backend/.env` and replace the placeholders with real values:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER-URL/mitrascan?retryWrites=true&w=majority
MONGODB_DB_NAME=mitrascan
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
JWT_SECRET=LONG_RANDOM_SECRET
JWT_EXPIRES_IN=8h
```

Never commit `Backend/.env`. It contains secrets.

If the database password contains characters such as `@`, `#`, `$`, `%`, or `/`, URL-encode the password before putting it into the connection string.

### Verify the connection

Start the backend:

```powershell
cd Backend
npm install
npm run dev
```

Successful output:

```text
MongoDB connected
MitraScan API listening on http://localhost:5000
```

Check the health endpoint:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

The response should include:

```json
{
  "ok": true,
  "storage": "mongodb",
  "pdfBrowser": "configured"
}
```

If `MONGODB_URI` is empty, the API uses temporary memory storage. Those records disappear when the server stops.

## Authentication and authorization

### Public endpoints

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/health
```

### Authenticated endpoint

```text
GET /api/auth/me
```

### User roles

| Role | Permissions |
|---|---|
| Inspector | Create audits and access own audits and reports. |
| Supervisor | Create audits and access all audits and reports. |
| Admin | Full audit access and future administration features. |

Self-registration creates an `inspector` account. Supervisor and admin accounts should be created through a controlled administrative process before production deployment.

## API reference

### Register

```text
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Field Inspector",
  "email": "inspector@example.com",
  "password": "Inspector123!"
}
```

### Login

```text
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "inspector@example.com",
  "password": "Inspector123!"
}
```

### List audits

```text
GET /api/audits
Authorization: Bearer <token>
```

Inspectors receive their own audits. Supervisors and admins receive all audits.

### Create image or OCR audit

```text
POST /api/audits
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Fields:

- `labelImage`: optional JPG, PNG, WEBP, or TIFF image.
- `ocrText`: optional pasted OCR text.
- `productName`: optional product name.
- `inspector`: inspector name.
- `location`: inspection location.

### Create URL audit

```text
POST /api/audits/url
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "url": "https://www.amazon.com/product-url",
  "inspector": "Web inspector",
  "location": "Online"
}
```

### Get one audit

```text
GET /api/audits/:id
Authorization: Bearer <token>
```

### Download a report

```text
GET /api/audits/:id/report
Authorization: Bearer <token>
```

The frontend downloads this PDF through an authenticated request.

## Run the application

Open two PowerShell terminals from the project folder.

### Terminal 1: backend

```powershell
cd Backend
npm install
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### Terminal 2: frontend

```powershell
cd Frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Testing commands

Backend compliance smoke test:

```powershell
cd Backend
npm test
```

Frontend lint:

```powershell
cd Frontend
npm run lint
```

Frontend production build:

```powershell
cd Frontend
npm run build
```

Health check:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

## Security notes

- Keep real values only in `Backend/.env`.
- Never commit MongoDB Atlas passwords or JWT secrets.
- Use a long random `JWT_SECRET` in production.
- Restrict MongoDB Atlas Network Access to trusted IP addresses.
- Use HTTPS when the application is deployed.
- The current URL auditor reads public pages only and does not bypass website security controls.
- Final legal enforcement decisions require human inspector verification.

## Current limitations and future improvements

The current prototype does not yet perform physical font-size measurement, principal display panel detection, barcode validation, multilingual OCR, geolocation capture, or approved marketplace API integration.

Possible production improvements include:

- PaddleOCR or a multilingual OCR service.
- Computer vision for label boundaries and font-size measurement.
- S3-compatible evidence image storage.
- Background jobs for OCR and PDF generation.
- Full admin user management.
- Versioned legal rule sets.
- Automated API and integration test suites.
- Audit trails and inspector activity logs.
