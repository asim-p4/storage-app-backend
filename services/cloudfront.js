import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

const privateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY;
const keyPairId = process.env.AWS_KEY_PAIR_ID;
const dateLessThan = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // any Date constructor compatible
const distributionName = process.env.AWS_DISTRIBUTION_KEY;

export const createCloudFrontGetSignedUrl = ({
  key,
  download = false,
  filename,
}) => {
  const url = `${distributionName}/${key}?response-content-disposition=${encodeURIComponent(`${download ? "attachment" : "inline"}; filename=${filename}`)}`;
  const signedUrl = getSignedUrl({
    url,
    keyPairId,
    dateLessThan,
    privateKey,
  });
  return signedUrl;
};

// https://bibwild.wordpress.com/2024/06/18/cloudfront-in-front-of-s3-using-response-content-disposition/
