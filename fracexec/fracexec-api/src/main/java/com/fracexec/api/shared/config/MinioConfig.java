package com.fracexec.api.shared.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.util.List;

@Configuration
public class MinioConfig {

    private static final Logger log = LoggerFactory.getLogger(MinioConfig.class);

    @Value("${fracexec.minio.endpoint}")
    private String endpoint;

    @Value("${fracexec.minio.access-key}")
    private String accessKey;

    @Value("${fracexec.minio.secret-key}")
    private String secretKey;

    @Value("${fracexec.minio.buckets.docs}")
    private String docsBucket;

    @Value("${fracexec.minio.buckets.profiles}")
    private String profilesBucket;

    @Value("${fracexec.minio.buckets.contracts}")
    private String contractsBucket;

    /**
     * Em produção (endpoint vazio): usa IAM Role via DefaultCredentialsProvider.
     * Em local/dev (endpoint configurado): usa chaves estáticas para MinIO.
     */
    private AwsCredentialsProvider credentialsProvider() {
        return (endpoint == null || endpoint.isBlank())
            ? DefaultCredentialsProvider.create()
            : StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    @Bean
    public StaticCredentialsProvider minioCredentials() {
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(
            accessKey != null ? accessKey : "placeholder",
            secretKey != null ? secretKey : "placeholder"));
    }

    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
            .credentialsProvider(credentialsProvider())
            .region(Region.US_EAST_1);
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint)).forcePathStyle(true);
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
            .credentialsProvider(credentialsProvider())
            .region(Region.US_EAST_1);
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    @Bean
    public ApplicationRunner createBucketsOnStartup(S3Client s3Client) {
        return args -> {
            List<String> buckets = List.of(docsBucket, profilesBucket, contractsBucket);
            for (String bucket : buckets) {
                try {
                    s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
                    log.info("MinIO bucket already exists: {}", bucket);
                } catch (NoSuchBucketException e) {
                    s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                    log.info("MinIO bucket created: {}", bucket);
                } catch (Exception e) {
                    // pass exception object (not getMessage) to preserve full stack trace
                    log.warn("Could not verify/create MinIO bucket '{}': {}. " +
                        "Ensure MinIO is running before making file uploads.", bucket, e);
                }
            }
        };
    }
}
