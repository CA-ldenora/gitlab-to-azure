document.addEventListener('DOMContentLoaded', function () {
    const uploadCsv = document.getElementById('upload-csv');
    const dragDropArea = document.getElementById('drag-drop-area');
    const downloadUrl = document.getElementById('download-url');
    const fileInfo = document.getElementById('file-info');
    const previewContent = document.getElementById('preview-content');
    const errorBanner = document.getElementById('error-banner');
    const userAreaPathInputElement = document.getElementById('user-area-path-input');
    const userIterationPathInputElement = document.getElementById('user-iteration-path-input');
    const userTagsInputElement = document.getElementById('user-tags-input');
    const defaultSettingsBtn = document.getElementById('default-settings-btn');
    const defaultSettingsModal = document.getElementById('default-settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let uploadedCsvData;
    let uploadedFileName;

    // Enable buttons when file is uploaded
    uploadCsv.addEventListener('change', function () {
      resetContent();
      const file = uploadCsv.files[0];
      if (file) {
        if (file.type !== 'text/csv') {
          alert('Please upload a valid CSV file.');
          return;
        }
        updateFileInfo(file.name);
        parseCsv(file);
      }
    });

    // Drag and drop functionality
    dragDropArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      dragDropArea.classList.add('drag-over');
    });

    dragDropArea.addEventListener('dragleave', function () {
      dragDropArea.classList.remove('drag-over');
    });

    dragDropArea.addEventListener('drop', function (e) {
      e.preventDefault();
      dragDropArea.classList.remove('drag-over');
      resetContent();
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type !== 'text/csv') {
          alert('Please upload a valid CSV file.');
          return;
        }
        updateFileInfo(file.name);
        parseCsv(file);
      }
    });

    // Update file info
    function updateFileInfo(fileName) {
      uploadedFileName = fileName;
      fileInfo.textContent = `Loaded File: ${fileName}`;
    }

    // Parse CSV file
    function parseCsv(file) {
      Papa.parse(file, {
        complete: function (results) {
          if (results.errors.length) {
            displayErrors(results.errors);
          }
          uploadedCsvData = results.data;
          createDownloadLinkAndPreview();
        },
        header: true
      });
    }

    // Display errors in a banner
    function displayErrors(errors) {
      let errorMessages = '';
      errors.forEach((error, index) => {
        errorMessages += `Error ${index + 1}: ${error.message}<br>`;
      });
      errorBanner.innerHTML = errorMessages;
      errorBanner.style.display = 'block';
    }

    // Create download link and preview immediately after file is uploaded
    function createDownloadLinkAndPreview() {
      const convertedData = convertData(uploadedCsvData);

      // Convert the processed data back to CSV
      const csv = Papa.unparse(convertedData);

      // Create a blob for the download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const downloadFileName = uploadedFileName.replace(/\.csv$/i, '_converted.csv');
      downloadUrl.href = url;
      downloadUrl.download = downloadFileName;
      downloadUrl.textContent = `⬇️ Download ${downloadFileName}`;
      downloadUrl.style.display = 'inline-flex';

      previewConvertedData(convertedData);
    }

    function convertData(data) {
      const userAreaPathInput = userAreaPathInputElement.value;
      const userIterationPathInput = userIterationPathInputElement.value;
      const userTagsInput = userTagsInputElement.value;
      return data.map(row => {
        const convertedRow = {};
        const isBug = row['Title'] && row['Title'].toLowerCase().includes('bug');

        // Ensure required fields are mapped
        convertedRow['ID'] = row['ID'] || '';
        convertedRow['Work Item Type'] = isBug ? 'Bug' : 'Task';
        convertedRow['Title'] = row['Title'] || 'Untitled';
        convertedRow['Area Path'] = row['Area Path'] || userAreaPathInput;
        convertedRow['Iteration Path'] = row['Iteration Path'] || userIterationPathInput;
        convertedRow['Tags'] = row['Tags'] || userTagsInput;
        const description = `${row['URL'] || ''}
${marked.parse(row['Description'] || '')}`;
        if (isBug) {
          convertedRow['Repro Steps'] = description;
        } else {
          convertedRow['Description'] = description;
        }
        return convertedRow;
      });
    }

    function previewConvertedData(previewData) {
      if (!previewData || previewData.length === 0) {
        previewContent.textContent = 'No data to preview.';
        return;
      }

      if (previewData.length > 0) {
        let previewHtml = '<div class="preview-table-wrapper"><table class="preview-table"><thead><tr>';
        Object.keys(previewData[0]).forEach(header => {
          previewHtml += `<th>${header}</th>`;
        });
        previewHtml += '</tr></thead><tbody>';

        previewData.slice(0, 5).forEach(row => {
          previewHtml += '<tr>';
          Object.keys(row).forEach(key => {
            let value = row[key];
            if ((key === 'Repro Steps' || key === 'Description') && value) {
              value = value.substring(0, 30) + (value.length > 30 ? '...' : '');
            }
            previewHtml += `<td>${value || ''}</td>`;
          });
          previewHtml += '</tr>';
        });

        previewHtml += '</tbody></table></div>';
        previewContent.innerHTML = previewHtml;
      } else {
        previewContent.textContent = 'No data to preview.';
      }
    }

    // Reset content when a new file is uploaded
    function resetContent() {
      uploadedCsvData = undefined;
      fileInfo.textContent = 'No file uploaded.';
      errorBanner.style.display = 'none';
      errorBanner.innerHTML = '';
      previewContent.textContent = 'No data to preview.';
      downloadUrl.style.display = 'none';
    }

    // Open and close modal functionality
    defaultSettingsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      defaultSettingsModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', function () {
      defaultSettingsModal.style.display = 'none';
      createDownloadLinkAndPreview();
    });

    window.addEventListener('click', function (event) {
      if (event.target == defaultSettingsModal) {
        defaultSettingsModal.style.display = 'none';
        createDownloadLinkAndPreview();
      }
    });
  });