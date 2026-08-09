import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type GetObjectCommandOutput,
  type _Object,
} from "@aws-sdk/client-s3";
import { config } from "./config.ts";

const { accessKeyId, secretAccessKey, bucket, publicBase, accountId, endpoint: endpointEnv } =
  config.r2;

const endpoint =
  endpointEnv ??
  (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined);

if (!endpoint) {
  throw new Error(
    "Set R2_ACCOUNT_ID or R2_ENDPOINT in .env",
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
  `${publicBase.replace(/\/$/, "")}/${key}`;

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
