document.addEventListener("DOMContentLoaded", function () {
  const uploadCsv = document.getElementById("upload-csv");
  const dragDropArea = document.getElementById("drag-drop-area");
  const downloadUrl = document.getElementById("download-url");
  const downloadBtn = document.getElementById("download-button");
  const fileInfo = document.getElementById("file-info");
  const previewContent = document.getElementById("preview-content");
  const errorBanner = document.getElementById("error-banner");
  const customMappingEl = document.getElementById("custom-mapping");
  const defaultSettingsBtn = document.getElementById("default-settings-btn");
  const defaultSettingsModal = document.getElementById(
    "default-settings-modal"
  );
  const closeModalBtn = document.getElementById("close-modal-btn");

  let uploadedCsvData;
  let uploadedFileName;

  function handleFileUpload(file) {
    if (file.type !== "text/csv") {
      alert("Please upload a valid CSV file.");
      return;
    }
    dragDropArea.classList.add("dragged");
    updateFileInfo(file.name);
    parseCsv(file);
  }

  uploadCsv.addEventListener("change", function () {
    resetContent();
    handleFileUpload(uploadCsv.files[0]);
  });

  dragDropArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    dragDropArea.classList.add("drag-over");
  });

  dragDropArea.addEventListener("dragleave", function () {
    dragDropArea.classList.remove("drag-over");
  });

  dragDropArea.addEventListener("drop", function (e) {
    e.preventDefault();
    dragDropArea.classList.remove("drag-over");
    resetContent();
    handleFileUpload(e.dataTransfer.files[0]);
  });

  function updateFileInfo(fileName) {
    uploadedFileName = fileName;
    fileInfo.textContent = `Loaded File: ${fileName}`;
  }

  function parseCsv(file) {
    Papa.parse(file, {
      complete: function (results) {
        if (results.errors.length) {
          displayErrors(results.errors);
        }
        uploadedCsvData = results.data;
        createDownloadLinkAndPreview();
      },
      header: true,
    });
  }

  function displayErrors(errors) {
    let errorMessages = "";
    errors.forEach((error, index) => {
      errorMessages += `Error ${index + 1}: ${error.message}<br>`;
    });
    console.error(errorMessages);
    errorBanner.innerHTML = errorMessages;
    errorBanner.style.display = "block";
    setTimeout(() => {
      errorBanner.innerHTML = "";
      errorBanner.style.display = "none";
    }, 5000);
  }

  function createDownloadLinkAndPreview() {
    const convertedData = convertData(uploadedCsvData);

    // Convert the processed data back to CSV
    const csv = Papa.unparse(convertedData);

    // Create a blob for the download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const downloadFileName = uploadedFileName.replace(
      /\.csv$/i,
      "_converted.csv"
    );

    downloadUrl.href = url;
    downloadBtn.disabled = false;
    downloadUrl.download = downloadFileName;
    downloadUrl.title = `Download ${downloadFileName}`;
    downloadUrl.style.display = "inline-flex";

    previewConvertedData(convertedData);
  }
  /**
   * @default mappingDefaultFn
   */
  function getCustomMapping() {
    return createFunctionFromBody(
      document.getElementById("custom-mapping").value
    );
  }

  function convertData(data) {
    const userAreaPathInput = document.getElementById(
      "user-area-path-input"
    ).value;
    const userIterationPathInput = document.getElementById(
      "user-iteration-path-input"
    ).value;
    const userTagsInput = document.getElementById("user-tags-input").value;

    return data.map((gitlabRow) => {
      const azureRow = {};
      if (document.getElementById("custom-mapping").value) {
        mappingDefaultFn = getCustomMapping();
      }
      mappingDefaultFn(
        gitlabRow,
        azureRow,
        userAreaPathInput,
        userIterationPathInput,
        userTagsInput,
        marked
      );
      return azureRow;
    });
  }

  function mappingDefaultFn(
    gitlabRow,
    azureRow,
    userAreaPathInput,
    userIterationPathInput,
    userTagsInput,
    marked
  ) {
    // Tip: Avoid conditionally adding columns. 
    // Determine if the work item is a bug based on the title
    const title = gitlabRow["Title"] || "Untitled";
    const isBug = title.toLowerCase().includes("bug");
    // Map required fields
    azureRow["ID"] = gitlabRow["ID"] || "";
    azureRow["Work Item Type"] = isBug ? "Bug" : "Task";
    azureRow["Title"] = title;
    azureRow["Area Path"] = gitlabRow["Area Path"] || userAreaPathInput;
    azureRow["Iteration Path"] = gitlabRow["Iteration Path"] || userIterationPathInput;
    azureRow["Tags"] = gitlabRow["Labels"]?.split(',').filter(r => !r.match(/priority:(\d+)/)) || userTagsInput;
    const priorityMatch = gitlabRow["Labels"]?.match(/priority:(\d+)/);
    azureRow["Priority"] = priorityMatch ? +priorityMatch[1] + 1 : '';
    // Create a formatted description including the URL and Description
    const url = gitlabRow["URL"] || "";
    const descriptionContent = gitlabRow["Description"] || "";
    const description = `${url}\n${marked.parse(descriptionContent)}`;
    // Map the description to the appropriate field for Bug or Task
    azureRow["Repro Steps"] = isBug ? description : '';
    azureRow["Description"] = !isBug ? description : '';

  }

  function previewConvertedData(previewData) {
    if (!previewData || previewData.length === 0) {
      previewContent.textContent = "No data to preview.";
      return;
    }

    if (previewData.length > 0) {
      let previewHtml =
        '<code class="preview-table-label">~ PREVIEW ~</code><div class="preview-table-wrapper"><table class="preview-table"><thead><tr>';
      Object.keys(previewData[0]).forEach((header) => {
        previewHtml += `<th>${header}</th>`;
      });
      previewHtml += "</tr></thead><tbody>";

      previewData.slice(0, 5).forEach((row) => {
        previewHtml += "<tr>";
        Object.keys(row).forEach((key) => {
          let value = row[key];
          if ((key === "Repro Steps" || key === "Description") && value) {
            value = value.substring(0, 30) + (value.length > 30 ? "..." : "");
          }
          previewHtml += `<td>${value || ""}</td>`;
        });
        previewHtml += "</tr>";
      });

      previewHtml += "</tbody></table></div>";
      previewContent.innerHTML = previewHtml;
    } else {
      previewContent.textContent = "No data to preview.";
    }
  }

  function resetContent() {
    uploadedCsvData = undefined;
    fileInfo.textContent = "No file uploaded.";
    errorBanner.style.display = "none";
    errorBanner.innerHTML = "";
    previewContent.textContent = "No data to preview.";
  }

  defaultSettingsBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    defaultSettingsModal.style.display = "flex";
    customMappingEl.style.height = "0px";
    setTimeout(() => {
      customMappingEl.style.height = "323px";
      customMappingEl.value = extractFunctionBody(mappingDefaultFn);
    }, 1000);
  });

  closeModalBtn.addEventListener("click", function () {
    defaultSettingsModal.style.display = "none";
    createDownloadLinkAndPreview();
  });

  function extractFunctionBody(fn) {
    const fnString = fn.toString();
    const bodyMatch = fnString.match(/{([\s\S]*)}/);
    return bodyMatch ? bodyMatch[1] : "";
  }

  function createFunctionFromBody(functionContent) {
    return new Function(
      "gitlabRow",
      "azureRow",
      "userAreaPathInput",
      "userIterationPathInput",
      "userTagsInput",
      "marked",
      functionContent
    );
  }
  window.addEventListener("click", function (event) {
    if (event.target == defaultSettingsModal) {
      defaultSettingsModal.style.display = "none";
      createDownloadLinkAndPreview();
    }
  });
});
