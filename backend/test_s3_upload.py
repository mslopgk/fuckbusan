"""
S3 업로드 테스트 (로컬용)
실행: python test_s3_upload.py
"""
import boto3
from botocore.exceptions import ClientError
import uuid
import os

S3_BUCKET = os.getenv("S3_BUCKET_NAME", "busan-promotion")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")

AWS_ACCESS_KEY_ID = os.getenv("MY_AWS_ACCESS_KEY", "AKIAQD6ACFQH3AP4F47T")
AWS_SECRET_ACCESS_KEY = os.getenv("MY_AWS_SECRET_KEY", "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")

def test_s3_upload():
    s3 = boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )

    # 테스트용 임시 파일 생성
    test_filename = f"test_{uuid.uuid4()}.txt"
    test_content = b"S3 upload test"

    print(f"버킷: {S3_BUCKET}")
    print(f"리전: {AWS_REGION}")
    print(f"파일명: {test_filename}")

    try:
        # 업로드
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=test_filename,
            Body=test_content,
            ContentType="text/plain"
        )
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{test_filename}"
        print(f"✅ 업로드 성공: {url}")

        # 삭제 (정리)
        s3.delete_object(Bucket=S3_BUCKET, Key=test_filename)
        print("✅ 테스트 파일 삭제 완료")

    except ClientError as e:
        print(f"❌ 실패: {e}")

if __name__ == "__main__":
    test_s3_upload()
