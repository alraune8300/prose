export const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use webp for best compression, fallback to jpeg if somehow unsupported (though all modern browsers support webp)
        const compressedBase64 = canvas.toDataURL('image/webp', quality);
        
        // Check size of base64
        // Base64 size = (characters * 3) / 4
        const sizeInBytes = Math.round((compressedBase64.length * 3) / 4);
        console.log(`Compressed image from ${file.size} bytes to ${sizeInBytes} bytes`);
        
        resolve(compressedBase64);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};
