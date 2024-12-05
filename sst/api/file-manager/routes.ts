export function importRoutes({ resources }) {
  //////////////////
  // Folder
  //////////////////

  let { myUGCBucket, myCDN, api, UsersTable, FolderTable } = resources;

  api.route("POST /api/file-manager/folder/create", {
    handler: "sst/api/file-manager/folder.create",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });

  api.route("POST /api/file-manager/folder/remove", {
    handler: "sst/api/file-manager/folder.remove",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });
  api.route("POST /api/file-manager/folder/list", {
    handler: "sst/api/file-manager/folder.list",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });
  api.route("POST /api/file-manager/folder/get", {
    handler: "sst/api/file-manager/folder.get",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });
  api.route("POST /api/file-manager/folder/update", {
    handler: "sst/api/file-manager/folder.update",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });

  api.route("POST /api/file-manager/folder/publicList", {
    handler: "sst/api/file-manager/folder.publicList",
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
  });

  api.route("GET /api/file-manager/files/signGenericFile", {
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    handler: "sst/api/file-manager/files.signGenericFile",
  });

  api.route("POST /api/file-manager/files/removeGenericFile", {
    link: [myUGCBucket, myCDN, api, UsersTable, FolderTable],
    handler: "sst/api/file-manager/files.removeGenericFile",
  });
}
