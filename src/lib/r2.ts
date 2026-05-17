import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type GetObjectCommandOutput,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicBase = process.env.R2_PUBLIC_URL;

if (!accessKeyId || !secretAccessKey || !bucket || !publicBase) {
  throw new Error(
    "Missing R2 env vars (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)",
  );
}

const accountId = process.env.R2_ACCOUNT_ID;

const endpoint =
  process.env.R2_ENDPOINT ??
  (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined);

if (!endpoint) {
  throw new Error(
    "Set R2_ACCOUNT_ID (Cloudflare account ID) or R2_ENDPOINT in .env",
  );
}

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

export const R2_BUCKET = bucket;

export const publicUrl = (key: string): string =>
  `${publicBase!.replace(/\/$/, "")}/${key}`;

export const putObject = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> => {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicUrl(key);
};

export const signedGetUrl = async (key: string, ttlSec = 60 * 60) =>
  getSignedUrl(r2, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: ttlSec,
  });

export const getObject = async (
  key: string,
  range?: string,
): Promise<GetObjectCommandOutput> =>
  r2.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    }),
  );

export const deleteObject = async (key: string) => {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

export const listObjects = async (prefix?: string): Promise<_Object[]> => {
  const all: _Object[] = [];
  let token: string | undefined;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    if (res.Contents) all.push(...res.Contents);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return all;
};

export const streamToBuffer = async (
  body: GetObjectCommandOutput["Body"],
): Promise<Buffer> => {
  if (!body) return Buffer.alloc(0);
  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
};
