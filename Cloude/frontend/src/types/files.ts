/**
 * Interface for a file object.
 */
export interface File {
    id: string;
    name: string;
    type: 'file';
    size: number;
    original_name: string;
    mime_type: string;
    folder_id: string | null;
    created_at: string;
    url: string; // ✅ добавляем

  }
  
  /**
   * Interface for a folder object.
   */
  export interface Folder {
    id: string;
    name: string;
    type: 'folder';
    parent_id: string | null;
    created_at: string;
  }
  
  /**
   * Interface for a file object, including all database-related fields.
   * This is used for a more detailed representation of a file.
   */
  export interface FileProps {
    id: string;
    name: string;
    type: 'file';
    size: number;
    original_name: string;
    mime_type: string;
    storage_path: string;
    folder_id: string | null;
    user_id: string;
    is_deleted: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  }
  