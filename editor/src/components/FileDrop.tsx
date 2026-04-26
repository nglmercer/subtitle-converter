import type { JSX } from 'preact';

interface Props {
  onFile: (name: string, content: string) => void;
}

export function FileDrop({ onFile }: Props) {
  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onFile(file.name, reader.result as string);
    };
    reader.readAsText(file);
    e.currentTarget.value = '';
  };

  return (
    <div class="filedrop">
      <label class="btn filedrop-btn">
        <input type="file" accept=".srt,.vtt,.ass,.json,.csv,text/plain" onChange={handleChange} />
        Choose File
      </label>
    </div>
  );
}
