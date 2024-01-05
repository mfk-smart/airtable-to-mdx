import "dotenv/config";
import fs from "fs";
import path from "path";
const airtable_base = process.env.PUBLIC_AT_BASE;
const airtable_key = process.env.PUBLIC_AT_KEY;
const endpoint = `https://api.airtable.com/v0/${airtable_base}`;
const headers = {
  Authorization: `Bearer ${airtable_key}`,
};

const table = process.argv[2];
const view = process.argv[3];
const records = process.argv[4];

if (!table || !view || !records) {
  console.log("Usage: node app.js <table> <view> <records>");
  process.exit(1);
}

async function getReferences(view, maxRecords = 100) {
  return fetch(`${endpoint}/${table}?maxRecords=${maxRecords}&view=${view}`, {
    headers,
  })
    .then((res) => res.json())
    .then((res) => {
      res.records.forEach((record) => {
        createMDXFile(record);
      });
    });
}

function createMDXFile(record) {
  if (!record.fields["filename"]) {
    console.log(`> ${record.fields["Company"]} has no logo!`);
    return;
  }
  const mdxFileName = record.fields["filename"].split(".")[0];
  const mdxPath = path.join(process.cwd(), "data", mdxFileName + ".mdx");

  const mdxTemplate = `---
name: "${record.fields["Company"]}"
logo: "${record.fields["filename"].split(".")[0]}"
availableLocales: ["en", "tr"]
landingPage: ${record.fields["LandingPage"] || false}
${
  record.fields["Lat"] && record.fields["Lon"]
    ? `location: { lat: ${record.fields["Lat"]}, lng: ${record.fields["Lon"]}}`
    : ""
}
---

`;

  fs.writeFileSync(mdxPath, mdxTemplate);
  console.log(`> ${mdxFileName} created!`);
}

let refs = await getReferences(view, records);
