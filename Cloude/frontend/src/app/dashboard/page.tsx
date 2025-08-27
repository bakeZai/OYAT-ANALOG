"use client";

import { useState, useEffect } from "react";
import FileUpload from "@/components/files/FileUpload";
import FileGrid from "@/components/files/FileGrid";
import FolderManager from "@/components/files/FolderManager";
import FilePreview from "@/components/files/FilePreview";
import { File, Folder } from "@/types/files";
import Layout from "@/components/layout/Layout";

// ======================== //
export default function DashboardPage() {
  const [files, setFiles] = useState<(File | Folder)[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  // Запрос файлов с сервера
  const fetchFiles = async () => {
    try {
      console.log("Refreshing files...");
      // пример: const { data } = await supabase.from("files").select("*");
      // setFiles(data || []);
      setFiles([]); // пока пусто
    } catch (err) {
      console.error("Ошибка при загрузке файлов:", err);
    }
  };
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const currentFolderId = null; // или id текущей папки


  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileDelete = async (id: string) => {
    console.log("Удаляю файл:", id);
    await fetchFiles();
  };

  const handleFileRename = async (id: string, name: string) => {
    console.log("Переименовываю файл:", id, name);
    await fetchFiles();
  };

  const handleFolderClick = (folder: Folder) => {
    console.log("Открыл папку:", folder);
  };

  return (
    <Layout>
    <div className="p-4 space-y-4">
      {/* Upload */}

      
      <FileUpload
     open={uploadModalOpen}                // управляем открытием
      onClose={() => setUploadModalOpen(false)} // закрытие диалога
     onUploadSuccess={fetchFiles}          // что делать после загрузки
    currentFolderId={currentFolderId}     // передаем текущую папку


    
    />

<button
  onClick={() => setUploadModalOpen(true)}
  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
>
  Добавить файл
</button>

      {/* Кнопка для создания папки */}
      <button
        onClick={() => setFolderModalOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Создать папку
      </button>

      {/* Модалка создания папки */}
      <FolderManager
        open={folderModalOpen}
         onClose={() => setFolderModalOpen(false)}
        onCreateFolder={async (folderName: string) => {
        console.log("Создаю папку:", folderName);
        setFolderModalOpen(false);
         await fetchFiles();
  }}
  onFolderCreated={fetchFiles}
/>


      {/* Сетка файлов */}
      <FileGrid
        files={files}
        onFileClick={handleFileClick}
        onFileDelete={handleFileDelete}
        onFileRename={handleFileRename}
        onFolderClick={handleFolderClick}
        onRefresh={fetchFiles}
      />

      {/* Превью файла */}
      {selectedFile && (
        <FilePreview
        open={!!selectedFile}
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
      
      )}
    </div>
    </Layout>
  );
}

