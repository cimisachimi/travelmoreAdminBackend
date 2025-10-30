import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Efek untuk inisialisasi Quill
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });

      quillRef.current = quill;

      // ✅ --- FIX 1 ---
      // Set konten awal, bahkan jika string kosong
      // Kita periksa null/undefined, bukan hanya truthiness
      if (value !== null && value !== undefined) {
        quill.root.innerHTML = value;
      }
      // ✅ --- END FIX 1 ---

      quill.on('text-change', (delta, oldDelta, source) => {
        // Hanya panggil onChange jika perubahan berasal dari 'user'
        if (source === 'user') {
          onChange(quill.root.innerHTML);
        }
      });
    }
  }, []); // Hanya berjalan sekali

  // Efek untuk memperbarui konten jika `value` dari parent berubah
  useEffect(() => {
    if (quillRef.current && value !== null && value !== undefined && quillRef.current.root.innerHTML !== value) {
      // ✅ --- FIX 2 ---
      // Kita set konten secara 'silent' untuk tidak memicu event 'text-change'
      // Ini mencegah loop render yang tidak perlu
      quillRef.current.clipboard.dangerouslyPasteHTML(value);
      // ✅ --- END FIX 2 ---
    }
  }, [value]);

  return <div ref={editorRef} style={{ minHeight: '200px', backgroundColor: 'white' }} />;
};

export default QuillEditor;
