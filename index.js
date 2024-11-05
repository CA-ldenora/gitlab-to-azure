document.addEventListener("DOMContentLoaded", function () {
  const uploadCsv = document.getElementById("upload-csv");
  const dragDropArea = document.getElementById("drag-drop-area");
  const downloadUrl = document.getElementById("download-url");
  const downloadBtn = document.getElementById("download-button");
  const fileInfo = document.getElementById("file-info");
  const previewContent = document.getElementById("preview-content");
  const errorBanner = document.getElementById("error-banner");
  const infoBanner = document.getElementById("info-banner");
  const customMappingEl = document.getElementById("custom-mapping");
  const customFiltersEl = document.getElementById("custom-filters");
  const defaultSettingsBtn = document.getElementById("default-settings-btn");
  const defaultSettingsModal = document.getElementById(
    "default-settings-modal"
  );

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
      errorMessages += `Error ${index + 1}: ${error.message}, row: ${
        error.row
      }`;
    });
    console.error(errorMessages);
    errorBanner.innerHTML = errorMessages;
    errorBanner.style.display = "block";
    setTimeout(() => {
      errorBanner.innerHTML = "";
      errorBanner.style.display = "none";
    }, 5000);
  }

  function displayInfo(infos) {
    let infoMessages = "";
    infos.forEach((info, index) => {
      infoMessages += `Info: ${index + 1}: ${info.message}<br>`;
    });
    console.info(infoMessages);
    infoBanner.innerHTML = infoMessages;
    infoBanner.style.display = "block";
    setTimeout(() => {
      infoBanner.innerHTML = "";
      infoBanner.style.display = "none";
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

  function getCustomEntry(
    entry = "custom-mapping",
    args = [
      "gitlabRow",
      "azureRow",
      "userAreaPathInput",
      "userIterationPathInput",
      "userTagsInput",
      "marked",
    ]
  ) {
    return createFunctionFromBody(document.getElementById(entry).value, args);
  }

  function convertData(data) {
    const userAreaPathInput = document.getElementById(
      "user-area-path-input"
    ).value;
    const userIterationPathInput = document.getElementById(
      "user-iteration-path-input"
    ).value;
    const userLabelsInput = document.getElementById(
      "user-labels-filters-input"
    ).value;
    const userTagsInput = document.getElementById("user-tags-input").value;

    const retVal = data
      .filter((gitlabRow) => {
        let retVal = true;
        if (document.getElementById("custom-filters").value) {
          filterDefaultFn = getCustomEntry("custom-filters", [
            "gitlabRow",
            "retVal",
            "userPriorityInput",
            "marked",
          ]);
        }
        if (userLabelsInput) {
          retVal = filterDefaultFn(gitlabRow, retVal, userLabelsInput, marked);
        }

        return retVal;
      })
      .map((gitlabRow) => {
        const azureRow = {};
        if (document.getElementById("custom-mapping").value) {
          mappingDefaultFn = getCustomEntry("custom-mapping");
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
    displayInfo([
      {
        message: `filtered: ${retVal.length} rows`,
      },
      {
        message: "priority migrate to azure priority +1",
      },
    ]);
    return retVal;
  }
  function filterDefaultFn(gitlabRow, userPriorityInput) {
    return userPriorityInput.split(",").some((priority) => {
      return gitlabRow["Labels"]?.includes(priority);
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

    //#region Basic Field Mapping
    azureRow["ID"] = gitlabRow["Issue ID"] || "";
    azureRow["Note"] = "";
    //#endregion

    //#region Title and Work Item Type
    const title = gitlabRow["Title"] || "Untitled";
    azureRow["Title"] = title;

    const isBug = title.toLowerCase().includes("bug");
    azureRow["Work Item Type"] = isBug ? "Bug" : "Task";
    //#endregion

    //#region Tags and Priority
    azureRow["Tags"] =
      gitlabRow["Labels"]
        ?.split(",")
        .filter((r) => !r.match(/priority:(\d+)/)) || userTagsInput;

    const priorityMatch = gitlabRow["Labels"]?.match(/priority:(\d+)/);
    azureRow["Priority"] = priorityMatch ? +priorityMatch[1] + 1 : "";
    //#endregion

    //#region Status
    const statusMatch = gitlabRow["Labels"]?.match(/status:(\d+)/);
    azureRow["Priority"] = statusMatch ? statusMatch[1] : "";
    //#endregion

    const descriptionContent = gitlabRow["Description"] || "";

    //#region Effort Calculation
    let timeEstimate = Math.floor(
      (gitlabRow["Time Estimate"] / 1000 / 60 / 60) % 24
    );
    if (!timeEstimate) {
      timeEstimate = descriptionContent.match(
        /### Effort\(h\)[\s\n\r]+(\d+)/,
        "$1"
      );
    }
    
    azureRow["Effort"] = timeEstimate ?? "";
    //#endregion

    //#region Description Formatting
    const url = gitlabRow["URL"] || "";
    const description = marked
      .parse(`[#{${azureRow["ID"]}}](${url})\n${descriptionContent}`)
      .replace(",", "&#44;");

    azureRow["Repro Steps"] = isBug ? description : "";
    azureRow["Description"] = !isBug ? description : "";
    //#endregion

    //#region Area and Iteration Paths
    azureRow["Area Path"] = gitlabRow["Area Path"] || userAreaPathInput;
    azureRow["Iteration Path"] =
      gitlabRow["Iteration Path"] || userIterationPathInput;
    //#endregion
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
    customFiltersEl.style.height = "0px";
    setTimeout(() => {
      customMappingEl.style.height = "323px";
      customMappingEl.value = extractFunctionBody(mappingDefaultFn);
      customFiltersEl.style.height = "150px";
      customFiltersEl.value = extractFunctionBody(filterDefaultFn);
    }, 1500);
  });

  function extractFunctionBody(fn) {
    const fnString = fn.toString();
    const bodyMatch = fnString.match(/{([\s\S]*)}/);
    return bodyMatch ? bodyMatch[1] : "";
  }
  /**
   * @param {string} functionContent
   * @param {string[]} args
   * @returns {Function}
   */
  function createFunctionFromBody(functionContent, args) {
    return new Function(...args, functionContent);
  }
  window.addEventListener("click", function (event) {
    if (event.target == defaultSettingsModal) {
      defaultSettingsModal.style.display = "none";
      createDownloadLinkAndPreview();
    }
  });
});
