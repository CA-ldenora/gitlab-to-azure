# GitLab to Azure DevOps Converter

## Overview
The **GitLab to Azure DevOps Converter** is a tool designed to simplify the migration process from GitLab issues to Azure DevOps work items. With support for CSV import/export and customizable mapping settings, this tool aims to streamline the transition and reduce manual efforts.

## Features
- **CSV Import and Export**: Easily upload GitLab issues as a CSV file and convert them into Azure DevOps-compatible format.
- **Custom Mapping**: Configure custom mappings for fields like Area Path, Iteration Path, and Tags to fit your specific project needs.
- **Advanced Mapping**: Define complex mapping using pure javascrtipt.

## Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge, Safari)
- CSV file exported from GitLab issues
- JavaScript enabled

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/CA-ldenora/gitlab-to-azure.git
   ```
2. Navigate to the project directory:
   ```bash
   cd gitlab-to-azure
   ```
3. Open `index.html` in your browser (consider using a local server, e.g., Python's SimpleHTTPServer, to avoid CORS issues).

### Usage
1. **Export CSV from GitLab**: Export the issues from your GitLab project as a CSV file.
2. **Upload CSV**: Click the `Upload CSV` button or drag and drop your GitLab CSV file.
3. **Mapping Settings**: Click the `Settings` button to configure field mappings and complex status mappings (e.g., status, tags, area path).
4. **Preview & Download**: Review the converted data and click `Download Converted File` to save the Azure DevOps-compatible CSV.
5. **Upload to Azure DevOps**: Load the CSV file into Azure DevOps in the work item query section.

## Custom Mapping
The tool allows you to define advanced custom mappings using JavaScript code directly within the UI:
- Open the mapping settings modal.
- Define complex conditions to map GitLab fields to Azure DevOps work item fields.
- Use the provided textarea for custom mappings, including logic based on fields like `Title`, `Tags`, etc.

## Contributing
Contributions are welcome! If you would like to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

## Contact
For questions or support, please contact [ldenora@codearchitects.com](mailto:ldenora@codearchitects.com)

## Acknowledgements
- **PapaParse**: CSV parsing functionality.
- **Marked.js**: Markdown parsing for description fields.
- **HighlightedCode**: Code syntax highlighting.
