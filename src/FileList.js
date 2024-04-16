import React, { useEffect, useState } from 'react';
import { Auth, Storage } from 'aws-amplify';

function FileList() {
    const [files, setFiles] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);

    // 파일의 크기를 포맷하기 위한 함수
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const fetchFiles = async (token = null) => {
    setLoading(true);
    try {
        const user = await Auth.currentAuthenticatedUser();
        const emailDomain = user.attributes.email.split('@')[1];
        const result = await Storage.list(`${emailDomain}/`, {
            maxKeys: 1000, // AWS S3 API는 최대 1000까지 허용
            nextToken: token,
        });
        if (result && Array.isArray(result.results)) {
            let filesWithDetails = result.results.map(file => ({
                ...file,
                key: file.key.substring(file.key.lastIndexOf('/') + 1),
                size: file.size ? formatBytes(file.size) : 'Unknown Size',
                lastModified: file.lastModified,
            }));

            // 날짜 기준으로 내림차순 정렬
            filesWithDetails.sort((a, b) => b.lastModified - a.lastModified);

            // 상위 30개 항목만 유지
            filesWithDetails = filesWithDetails.slice(0, 30);

            setFiles(filesWithDetails);
            setNextToken(result.nextToken);
        } else {
            setFiles([]);
            setNextToken(null);
        }
    } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
    fetchFiles();
}, []);

useEffect(() => {
    console.log('Files updated:', files);
}, [files]);

    return (
        <div>
            <h3>File List</h3>
            {loading && <p>Loading...</p>}
            {!loading && files.length === 0 && <p>No files found.</p>}
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.key} - {file.size ? file.size : 'Size Unknown'}
                    </li>
                ))}
            </ul>
            {nextToken && <button onClick={() => fetchFiles(nextToken)}>Load More</button>}
        </div>
    );
}

export default FileList;
