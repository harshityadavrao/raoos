let editor;
let currentLang = 'html';
let codeSnippets = {
  html: '<h1>Hello World</h1>',
  css: 'body { background: lightblue; }',
  js: 'console.log("hello world");',
  python: 'print("Hello from Python!")'
};

document.addEventListener("DOMContentLoaded", async () => {
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "htmlmixed",
    theme: "dracula"
  });

  editor.setValue(codeSnippets.html);

  // Load Pyodide
  window.pyodide = await loadPyodide();

  // Tab switching
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Save current code
      codeSnippets[currentLang] = editor.getValue();
      currentLang = tab.dataset.lang;

      // Set new code + mode
      editor.setValue(codeSnippets[currentLang]);
      const modeMap = {
        html: "htmlmixed",
        css: "css",
        js: "javascript",
        python: "python"
      };
      editor.setOption("mode", modeMap[currentLang]);
    });
  });
});

async function runCode() {
  const output = document.getElementById("output");
  const preview = document.getElementById("preview");

  output.style.display = "none";
  preview.style.display = "none";

  codeSnippets[currentLang] = editor.getValue();

  if (currentLang === "python") {
    output.style.display = "block";
    output.textContent = "Running Python...";

    try {
      await pyodide.loadPackagesFromImports(codeSnippets.python);

      let result = await pyodide.runPythonAsync(`
import sys
from io import StringIO
_output = StringIO()
sys.stdout = _output
sys.stderr = _output

${codeSnippets.python}

_output.getvalue()
      `);

      output.textContent = result || "✅ Executed (no output)";
    } catch (err) {
      output.textContent = "❌ Python Error: " + err;
    }

  } else if (["html", "css", "js"].includes(currentLang)) {
    preview.style.display = "block";

    const fullCode = `
      <html>
      <head><style>${codeSnippets.css}</style></head>
      <body>
        ${codeSnippets.html}
        <script>${codeSnippets.js}<\/script>
      </body>
      </html>
    `;

    preview.srcdoc = fullCode;
  }
}

function saveProject() {
  localStorage.setItem("leeosProject", JSON.stringify(codeSnippets));
  alert("✅ Project saved locally.");
}

function loadProject() {
  const data = localStorage.getItem("leeosProject");
  if (data) {
    codeSnippets = JSON.parse(data);
    editor.setValue(codeSnippets[currentLang]);
    alert("📂 Project loaded.");
  } else {
    alert("❌ No saved project found.");
  }
}

function exportZip() {
  const zip = new JSZip();
  zip.file("index.html", codeSnippets.html);
  zip.file("style.css", codeSnippets.css);
  zip.file("script.js", codeSnippets.js);
  zip.file("main.py", codeSnippets.python);

  zip.generateAsync({ type: "blob" }).then(function(content) {
    saveAs(content, "leeos_project.zip");
  });
}
