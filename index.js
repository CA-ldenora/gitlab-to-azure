document.addEventListener("DOMContentLoaded", function () {
  const uploadCsv = document.getElementById("upload-csv");
  const dragDropArea = document.getElementById("drag-drop-area");
  const downloadUrl = document.getElementById("download-url");
  const downloadBtn = document.getElementById("download-button");
  const fileInfo = document.getElementById("file-info");
  const previewContent = document.getElementById("preview-content");
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

  async function createDownloadLinkAndPreview() {
    previewContent.textContent = "Fetch images...";
    const convertedData = await convertData(uploadedCsvData);

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

  async function convertData(data) {
    const filterFn = (gitlabRow) => {
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
    };
    const mapFn = async (gitlabRow) => {
      const azureRow = {};
      if (document.getElementById("custom-mapping").value) {
        mappingDefaultFn = getCustomEntry("custom-mapping");
      }
      //#region image extraction
      if (gitlabRow["URL"])
        gitlabRow["Description"] = await embedImagesInMarkdown(
          gitlabRow["Description"],
          gitlabRow["URL"].replace(/\/-\/issues\/\d+/, "")
        );
      //#endregion
      mappingDefaultFn(
        gitlabRow,
        azureRow,
        userAreaPathInput,
        userIterationPathInput,
        userTagsInput,
        marked
      );

      return azureRow;
    };
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

    const asyncFilterMap = async (array) => {
      const results = [];
      for (const element of array) {
        if (filterFn(element)) {
          const mappedValue = await mapFn(element);
          results.push(mappedValue);
        }
      }
      return results;
    };

    const filteredAndMapped = await asyncFilterMap(data);

    displayInfo([
      {
        message: `filtered: ${filteredAndMapped.length} rows`,
      },
      {
        message: "priority migrate to azure priority +1",
      },
    ]);
    return filteredAndMapped;
  }
  function filterDefaultFn(gitlabRow, userPriorityInput) {
    return [
      "991",
      "1150",
      "1169",
      "1205",
      "1290",
      "1293",
      "1339",
      "1372",
      "876",
      "1007",
      "1116",
      "1118",
      "1196",
      "1197",
      "1241",
      "1245",
      "1263",
      "1275",
      "1281",
      "1301",
      "1316",
      "1375",
      "865",
      "1173",
      "1233",
      "1240",
      "1249",
      "1253",
      "1274",
      "1276",
      "1282",
      "1283",
      "1284",
      "1299",
      "1334",
      "316",
      "1142",
      "1143",
      "1152",
      "1182",
      "1219",
      "1294",
      "1304",
      "1056",
      "1092",
      "1128",
      "1151",
      "1161",
      "1162",
      "1170",
      "1187",
      "1188",
      "1215",
      "1227",
      "1243",
      "1247",
      "1256",
      "1257",
      "1285",
      "1303",
      "1307",
      "1373",
    ].includes(gitlabRow["Issue ID"]);
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
    azureRow["ID"] = "";
    const url = gitlabRow["URL"] || "";
    //#endregion

    //#region Title and Work Item Type
    const title = gitlabRow["Title"] || "Untitled";
    azureRow["Title"] = title;

    const isBug = title.toLowerCase().includes("bug");
    azureRow["Work Item Type"] = isBug ? "Bug" : "Task";
    //#endregion

    //#region Status and Priority
    const statusMatch = gitlabRow["Labels"]?.match(/status:(\w+)/);
    azureRow["Tags"] = statusMatch ? statusMatch[1] : "";

    const priorityMatch = gitlabRow["Labels"]?.match(/priority:(\d+)/);
    azureRow["Priority"] = priorityMatch ? +priorityMatch[1] + 1 : "";
    //#endregion

    //#region Status

    //#endregion

    let descriptionContent = gitlabRow["Description"] || "";

    //#region Effort Calculation
    let timeEstimate = Math.floor(
      (gitlabRow["Time Estimate"] / 1000 / 60 / 60) % 24
    );
    if (!timeEstimate) {
      // Define the regular expression pattern
      const regex = /(?:### )?Effort(?:\(h\))?[\s\n\r]+(\d+)/;
      // Execute the regex on the input string
      const match = regex.exec(descriptionContent);
      timeEstimate = match ? match[1] : "0";
    }

    azureRow["Effort"] = timeEstimate;
    //#endregion

    //#region Description Formatting

    const description =
      marked
        .parse(`[#${gitlabRow["Issue ID"]}](${url})\n\r${descriptionContent}`)
        .replace(",", "&#44;") ?? "no descr";

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
            value = escapeHtml(
              value.substring(0, 30) + (value.length > 30 ? "..." : "")
            );
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
    const errorBanner = document.getElementById("error-banner");
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

async function embedImagesInMarkdown(markdownContent, baseUrl) {
  const imageRegex = /!\[image\]\(\/uploads\/\S+\.png\)/g;

  const matches = markdownContent.match(imageRegex) || [];

  const fetchAndConvert = async (match) => {
    console.log("dowload img");
    const relativePath = match.match(/\(\/uploads\/\S+\.png\)/)[0].slice(1, -1);
    const imageUrl = `${baseUrl}${relativePath}`;

    try {
      const response = await fetch(imageUrl, { method: "GET" });

      if (!response.ok) {
        const allowedOrigin = response.headers.get(
          "Access-Control-Allow-Origin"
        );
        if (
          !allowedOrigin ||
          (allowedOrigin !== "*" && allowedOrigin !== window.location.origin)
        ) {
          `Accesso negato per l'immagine: ${imageUrl}`;
          return match;
        }
        console.error(`Errore HTTP! Status: ${response.status}`);
        return match;
      }

      const blob = await response.blob();
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return `![image](${base64String})`;
    } catch (error) {
      console.error(
        `Errore durante il recupero dell'immagine ${imageUrl}:`,
        error
      );
      return match;
    }
  };

  const replacements = await Promise.all(matches.map(fetchAndConvert));

  replacements.forEach((replacement, index) => {
    markdownContent = markdownContent.replace(matches[index], replacement);
  });

  return markdownContent;
}

function displayErrors(errors) {
  const errorBanner = document.getElementById("error-banner");
  let errorMessages = "";
  errors.forEach((error, index) => {
    errorMessages += `Error ${index + 1}: ${error.message}, row: ${error.row}`;
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
  const infoBanner = document.getElementById("info-banner");
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

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
