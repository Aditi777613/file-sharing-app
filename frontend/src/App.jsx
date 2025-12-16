import { useEffect, useState } from "react";
import "./App.css";
import { api, initAuthFromStorage, setAuthToken } from "./api";

function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState({});
  const [status, setStatus] = useState(""); // auth status
  const [statusType, setStatusType] = useState("info");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadStatusType, setUploadStatusType] = useState("info");
  const [filesStatus, setFilesStatus] = useState("");
  const [filesStatusType, setFilesStatusType] = useState("info");

  useEffect(() => {
    const token = initAuthFromStorage();
    if (token) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data.user))
        .then(() => fetchFiles())
        .catch(() => setAuthToken(null));
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus("");
    setStatusType("info");
    try {
      const url = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(url, authForm);
      setAuthToken(res.data.token);
      setUser(res.data.user);
      setAuthForm({ email: "", password: "", name: "" });
      fetchFiles();
    } catch (err) {
      setStatus(err.response?.data?.message || "Auth failed");
      setStatusType("error");
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/files");
      setFiles(res.data.files);
    } catch (err) {
      setFilesStatus("Could not load files");
      setFilesStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setUploadStatus("Uploading...");
    setUploadStatusType("info");
    try {
      await api.post("/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("Upload complete");
      setUploadStatusType("success");
      e.target.reset();
      fetchFiles();
    } catch (err) {
      setUploadStatus(err.response?.data?.message || "Upload failed");
      setUploadStatusType("error");
    }
  };

  const shareWithUsers = async (fileId, emails) => {
    try {
      await api.post(`/files/${fileId}/share`, { userEmails: emails });
      setFilesStatus("Shared with users");
      setFilesStatusType("success");
      fetchFiles();
    } catch (err) {
      setFilesStatus(err.response?.data?.message || "Share failed");
      setFilesStatusType("error");
    }
  };

  const generateLink = async (fileId, hours) => {
    try {
      const res = await api.post(`/files/${fileId}/link`, {
        expiresInHours: Number(hours) || 24,
      });
      setLinkInfo((prev) => ({ ...prev, [fileId]: res.data }));
      setFilesStatus("Link generated");
      setFilesStatusType("success");
    } catch (err) {
      setFilesStatus(err.response?.data?.message || "Link generation failed");
      setFilesStatusType("error");
    }
  };

  const downloadFile = async (fileId, linkToken, filename) => {
    try {
      const res = await api.get(`/files/${fileId}/download`, {
        responseType: "blob",
        params: linkToken ? { link: linkToken } : {},
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "file";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setFilesStatus(err.response?.data?.message || "Download failed");
      setFilesStatusType("error");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setFiles([]);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>File Sharing Dashboard</h1>
        {user && (
          <div className="user-row">
            <span>{user.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      <FileFlowAnimation />

      {!user && (
        <div className="card">
          <div className="tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
          <form onSubmit={handleAuth} className="form-grid">
            {mode === "register" && (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </label>
            <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
          </form>
        </div>
      )}

      {user && (
        <>
          <div className="card">
            <h2>Upload Files</h2>
            <form onSubmit={handleUpload} className="form-grid">
              <label>
                Files
                <input type="file" name="files" multiple required />
              </label>
              <button type="submit">Upload</button>
            </form>
            <p className="hint">Accepted: PDF, images, CSV. Max 10MB each.</p>
            {uploadStatus && (
              <div className={`status status-${uploadStatusType}`}>{uploadStatus}</div>
            )}
          </div>

          <div className="card">
            <div className="row">
              <h2>Your Files</h2>
              <button onClick={fetchFiles} disabled={loading}>
                Refresh
              </button>
            </div>
            {filesStatus && (
              <div className={`status status-${filesStatusType}`}>{filesStatus}</div>
            )}
            {loading && <p>Loading...</p>}
            {!loading && files.length === 0 && <p>No files yet.</p>}
            {!loading && files.length > 0 && (
              <div className="table">
                <div className="table-head">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Uploaded</span>
                  <span>Actions</span>
                </div>
                {files.map((file) => (
                  <FileRow
                    key={file._id}
                    file={file}
                    onShare={shareWithUsers}
                    onLink={generateLink}
                    onDownload={downloadFile}
                    linkInfo={linkInfo[file._id]}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {status && <div className={`status status-${statusType}`}>{status}</div>}
    </div>
  );
}

function FileRow({ file, onShare, onLink, onDownload, linkInfo }) {
  const [emails, setEmails] = useState("");
  const [hours, setHours] = useState(24);

  const sizeKb = Math.round(file.size / 1024);
  const base = api.defaults.baseURL || "";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const shareUrl = linkInfo?.shareUrl && `${normalizedBase}${linkInfo.shareUrl}`;

  return (
    <div className="table-row">
      <span>{file.originalName}</span>
      <span>{file.mimeType}</span>
      <span>{sizeKb} KB</span>
      <span>{new Date(file.uploadDate).toLocaleString()}</span>
      <span className="actions">
        <button onClick={() => onDownload(file._id, undefined, file.originalName)}>
          Download
        </button>
        <div className="inline-form">
          <input
            placeholder="Share emails (comma separated)"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <button
            onClick={() =>
              onShare(
                file._id,
                emails
                  .split(",")
                  .map((e) => e.trim())
                  .filter(Boolean)
              )
            }
          >
            Share
          </button>
        </div>
        <div className="inline-form">
          <input
            type="number"
            min="1"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <button onClick={() => onLink(file._id, hours)}>Link</button>
        </div>
        {shareUrl && (
          <div className="share-link">
            <span>Link (auth required):</span>
            <input value={shareUrl} readOnly />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy</button>
            <button
              onClick={() => onDownload(file._id, linkInfo.linkToken, file.originalName)}
            >
              Use Link
            </button>
          </div>
        )}
      </span>
    </div>
  );
}

function FileFlowAnimation() {
  const chips = [
    { icon: "📄", label: "Upload" },
    { icon: "👥", label: "Share with users" },
    { icon: "🔗", label: "Secure link" },
    { icon: "✅", label: "Access controlled" },
    { icon: "⏱", label: "Link expiry" },
    { icon: "📦", label: "Compressed storage" },
    { icon: "📊", label: "Activity tracked" },
  ];

  return (
    <div className="file-flow">
      <div className="file-flow-track">
        <div className="file-flow-group">
          {chips.map((chip) => (
            <span key={chip.label} className="file-chip">
              <span className="chip-icon">{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
        <div className="file-flow-group">
          {chips.map((chip) => (
            <span key={`${chip.label}-2`} className="file-chip">
              <span className="chip-icon">{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
