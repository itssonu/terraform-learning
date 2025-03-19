const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const uploadFilesAsync = (fileReport, fileLocation) => {
  if (fileReport && fileReport.length > 0) {
    const uploadPromises = fileReport.map((iterator, index) => {
      return new Promise((resolve, reject) => {
        iterator.mv(`/tmp/${fileLocation}/${iterator.name}`, (err) => {
          if (err) {
            reject(`Error occurred while moving file ${iterator.name}: ${err}`);
          } else {
            resolve(`File ${iterator.name} uploaded successfully`);
          }
        });
      });
    });

    return Promise.all(uploadPromises);
  } else {
    return Promise.resolve([]);
  }
};

const multiplefileProcessing = async (fileReport, filelocation, formDataType) => {
  try {
    // Assuming 'policeReport' is an array containing file information objects.
    if (fileReport != undefined) {
      await uploadFilesAsync(fileReport, filelocation);

      // Now that all files are uploaded, read the directory
      const dirName = fs.readdirSync(`/tmp/${filelocation}`, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return;
        }
      });

      const reorderedDirName = fileReport.map(({ name }) => {
        return dirName.find(dirName => dirName === name);
      });

      console.log(reorderedDirName);

      return reorderedDirName
    }
    // Continue with the rest of your code that uses 'formdata' here.
    // You can make an API request or do whatever you need with 'formdata'.

  } catch (err) {
    console.error('Error:', err);
  }
}

const deleteDirectoryData = async (directoryPath) => {
  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      fs.access(filePath, (error) => {
        if (!error) {
          fsExtra.remove(filePath, (unlinkError) => {
            if (!unlinkError) {
              // console.log(`Deleted: ${filePath}`);
            } else {
              // console.log(`Error deleting ${filePath}: ${unlinkError.message}`);
            }
          });
        } else {
          console.log(`Error accessing ${filePath}: ${error.message}`);
        }
      });
    }
    console.log('All files deleted successfully.');
  } catch (err) {
    console.log(`Error reading directory: ${err.message}`);
  }
};
module.exports = { multiplefileProcessing, deleteDirectoryData }