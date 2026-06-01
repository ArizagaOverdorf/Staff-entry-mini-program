import React, { useState, useEffect } from 'react';
import { Image } from 'antd';
import { getToken } from '../../../utils/auth';

const AuthImage: React.FC<{ fileId: string; alt: string }> = ({ fileId, alt }) => {
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    const token = getToken();
    fetch(`/api/admin/files/${fileId}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (error) return <span style={{ color: '#999', fontSize: 12 }}>加载失败</span>;
  if (!src) return <span style={{ color: '#999', fontSize: 12 }}>加载中...</span>;
  return (
    <Image
      src={src}
      alt={alt}
      width={240}
      height="auto"
      style={{ maxHeight: 360, objectFit: 'contain' }}
      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTQiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4="
    />
  );
};

export default AuthImage;
