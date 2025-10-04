import {
  Dropzone as DropzoneRoot,
  DropzoneDescription,
  DropzoneGroup,
  DropzoneInput,
  DropzoneTitle,
  DropzoneUploadIcon,
  DropzoneZone,
} from './components';
import { Accept } from 'react-dropzone';
import {
  FileList,
  FileListAction,
  FileListActions,
  FileListDescription,
  FileListHeader,
  FileListIcon,
  FileListInfo,
  FileListItem,
  FileListName,
  FileListSize,
} from '@/components/ui/file-list';
import { Trash2 } from 'lucide-react';

type DropzoneProps = {
  file?: File;
  setFile: (file: File | null) => void;
  accept?: Accept;
};

const defaultAccept: Accept = {
  'image/*': ['.jpg', '.png', '.jpeg', '.webp'],
};

export const Dropzone = ({
  file,
  setFile,
  accept = defaultAccept,
}: DropzoneProps) => {
  return (
    <DropzoneRoot
      accept={accept}
      maxSize={5 * 1024 * 1024} // 5MB
      onDropAccepted={files => setFile(files[0])}
    >
      <div className="flex flex-col gap-4">
        <DropzoneZone>
          <DropzoneInput />
          <DropzoneGroup className="gap-4">
            <DropzoneUploadIcon />
            <DropzoneGroup>
              <DropzoneTitle>
                Arraste e solte um arquivo aqui ou clique para selecionar
              </DropzoneTitle>
              <DropzoneDescription>
                Máximo de 5MB. Tipos suportados: jpg, png, jpeg, webp
              </DropzoneDescription>
            </DropzoneGroup>
          </DropzoneGroup>
        </DropzoneZone>
        {file && (
          <FileList>
            <FileListItem>
              <FileListHeader>
                <FileListIcon />
                <FileListInfo>
                  <FileListName>{file.name}</FileListName>
                  <FileListDescription>
                    <FileListSize>{file.size}</FileListSize>
                  </FileListDescription>
                </FileListInfo>
                <FileListActions onClick={() => setFile(null)}>
                  <FileListAction>
                    <Trash2 />
                  </FileListAction>
                </FileListActions>
              </FileListHeader>
            </FileListItem>
          </FileList>
        )}
      </div>
    </DropzoneRoot>
  );
};
