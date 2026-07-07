import { ChangeEvent, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { assetUrl } from '../../lib/apiClient';
import { uploadThumbnail } from './projectApi';

type ThumbnailUploaderProps = {
  projectId: number;
  thumbnailUrl?: string;
};

export function ThumbnailUploader({ projectId, thumbnailUrl }: ThumbnailUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadThumbnail(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      mutation.mutate(file);
    }
  }

  return (
    <div className="thumbnail-uploader">
      <div>
        <p className="panel-label">커버 이미지</p>
        <h2>갤러리 썸네일</h2>
      </div>
      <div className="thumbnail-preview">{thumbnailUrl ? <img src={assetUrl(thumbnailUrl)} alt="" /> : <span>대표 이미지를 업로드하세요</span>}</div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
      <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={mutation.isPending}>
        {mutation.isPending ? '업로드 중...' : '이미지 업로드'}
      </Button>
    </div>
  );
}
