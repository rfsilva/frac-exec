package com.fracexec.api.shared.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.time.Duration;

@Service
public class MinioStorageService {

    private final S3Presigner presigner;

    @Value("${fracexec.minio.buckets.docs}")
    private String docsBucket;

    @Value("${fracexec.minio.buckets.profiles}")
    private String profilesBucket;

    @Value("${fracexec.minio.buckets.contracts}")
    private String contractsBucket;

    // Both beans are provided by MinioConfig — credentials and endpoint are shared,
    // no duplicate StaticCredentialsProvider construction.
    public MinioStorageService(S3Presigner presigner) {
        this.presigner = presigner;
    }

    public String generatePresignedDownloadUrl(String bucket, String objectKey, Duration expiry) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(expiry)
            .getObjectRequest(GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build())
            .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }

    public String getDocsBucket() { return docsBucket; }
    public String getProfilesBucket() { return profilesBucket; }
    public String getContractsBucket() { return contractsBucket; }
}
