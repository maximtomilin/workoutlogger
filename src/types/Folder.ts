export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId: string | null;
  createdAt: string;
}
