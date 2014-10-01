module.exports = {
    getDirectory : function(path, success, error) {
        window.requestFileSystem(
            LocalFileSystem.PERSISTENT,
            0,
            function(fileSystem) {
                fileSystem.root.getDirectory(path, { create: true, exclusive: false }, 
                function(dirEntry){
                    success(dirEntry);
                }, function(){
                    console.log('[fileUtils] error: failed to getDirectory');
                    error();
                });
        });
    },
    
    copyFiles : function(fileList, destEntry, success) {
        var fileListCopy = fileList.splice(0);
        (function copyOne(){
            var file = fileListCopy.splice(0, 1)[0];
            window.phonegap.app.fileUtils.copyFile(file, destEntry,
                function(){
                    if(fileListCopy.length==0){
                        success();
                    }else{
                        copyOne();
                    }
                },
                function(){
                    console.error('[fileUtils][ERROR] Could not copy over files');
                });
        })();
    },

    //
    // Helper functions
    //
    getPathToWWWDir : function() {
        var currentLocation = window.location.href;
        var pathToWWW = currentLocation.substring(
            0,
            currentLocation.lastIndexOf('/') + 1
        );
        var indexOfWWW = currentLocation.indexOf('/www/');
        if (indexOfWWW != -1) {
            pathToWWW = currentLocation.substring(0, indexOfWWW + 5);
        }
        return pathToWWW;
    },

    copyFile : function(filePath, destinationDirectoryEntry, success, error){
        var relativePathToFile = filePath;
        var absolutePathToFile = window.phonegap.app.fileUtils.getPathToWWWDir() + relativePathToFile;
        window.phonegap.app.fileUtils.createPath(destinationDirectoryEntry, relativePathToFile, function(e) {
                destinationDirectoryEntry.getFile(relativePathToFile, {create: true},
                    function(newFile) {
                        console.log('[fileUtils] successfully CREATED the new file: [' + newFile.name + ']');

                        var fileTransfer = new FileTransfer();
                        console.log('[fileUtils] copying file from: [' + absolutePathToFile + '] to: [' + newFile.toURL() + ']');
                        fileTransfer.download(
                            absolutePathToFile,
                            newFile.toInternalURL(),
                            function() {
                                //copy success
                                console.log('[fileUtils] successfully COPIED the new file: [' + newFile.name + ']');
                                success();
                            },
                            function(error) {
                                console.log('[fileUtils][ERROR] failed to COPY the new file: [' + relativePathToFile +
                                    '] error code: [' + error.code + '] source: [' + error.source +
                                    '] target: [' + error.target + '] http_status: [' + error.http_status + ']');
                                error();
                            }
                        );
                    },
                    function(error) {
                        console.log('[fileUtils][ERROR] failed to GET a handle on the new file: [' + relativePathToFile + '] error code: [' + error.code + ']');
                        error();
                    });
            });
    },

    createPath : function(entry, filename, callback) {
        var parentDirectories = filename.split("/");
        if (parentDirectories.length === 1) {
            // There are no directories in this path
            callback();
        }
        else {
            for (var i = 0, l = parentDirectories.length - 1; i < l; ++i) {
                (function () { // Create a closure for the path variable to be correct when logging it
                    var path = parentDirectories.slice(0, i+1).join("/");
                    entry.getDirectory(path, { create: true, exclusive: true },
                        function () {
                            console.log("[fileUtils] Created directory " + path);
                            callback();
                        },
                        function(error) {
                            // error in this case means the directory already exists.
                            callback(error);
                        });
                })();
            }
        }
    }
}