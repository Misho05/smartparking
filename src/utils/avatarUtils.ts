/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PresetAvatar {
  id: string;
  label: string;
  category: 'operator' | 'admin' | 'security' | 'stylized';
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar-staff-m1',
    label: 'ოპერატორი (დავითი)',
    category: 'operator',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-staff-f1',
    label: 'ოპერატორი (ნინო)',
    category: 'operator',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-security-m1',
    label: 'დაცვა & უსაფრთხოება (გიორგი)',
    category: 'security',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-cashier-f1',
    label: 'სალარო / მენეჯერი (ანა)',
    category: 'operator',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-admin-m1',
    label: 'ადმინისტრატორი (ლევანი)',
    category: 'admin',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-admin-f1',
    label: 'ადმინისტრატორი (მარიამი)',
    category: 'admin',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-staff-m2',
    label: 'ტექნიკური პერსონალი (ალექსი)',
    category: 'operator',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-staff-f2',
    label: 'მორიგე ოპერატორი (სალომე)',
    category: 'operator',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-security-m2',
    label: 'დაცვის უფროსი (ზურაბი)',
    category: 'security',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-stylized-blue',
    label: 'SmartPark 3D ლურჯი',
    category: 'stylized',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-stylized-green',
    label: 'SmartPark 3D მწვანე',
    category: 'stylized',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'avatar-stylized-purple',
    label: 'SmartPark 3D იისფერი',
    category: 'stylized',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80',
  },
];

/**
 * Resizes and compresses an uploaded image file into a compact base64 JPEG data URL.
 * Automatically fits inside 256x256 px to preserve localStorage storage space.
 */
export async function compressAndReadImage(
  file: File,
  maxDimension = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic file validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('გთხოვთ აირჩიოთ გამოსახულების ფაილი (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('გამოსახულების დამუშავება ვერ მოხერხდა'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
