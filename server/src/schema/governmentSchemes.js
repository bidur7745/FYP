import { pgTable, uuid, text, timestamp, date, pgEnum } from "drizzle-orm/pg-core";

// Enum for scheme status
export const schemeStatusEnum = pgEnum("scheme_status", [
  'active',
  'expired',
  'upcoming'
]);

// Enum for scheme level
export const schemeLevelEnum = pgEnum("scheme_level", [
  'Central',
  'Provincial',
  'Local'
]);

// Enum for local body type
export const localBodyTypeEnum = pgEnum("local_body_type", [
  'Municipality',
  'Metro',
  'Rural Municipality'
]);

// Enum for region scope
export const regionScopeEnum = pgEnum("region_scope", [
  'specific',
  'district-wide',
  'province-wide',
  'national'
]);

export const governmentSchemesTable = pgTable("government_schemes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(), //title
  description: text("description"), // description
  schemeType: text("scheme_type"), // scheme type like subsidy, grant, utility support, etc.
  sector: text("sector").default("Agriculture"), //sector name default is agriculture
  level: schemeLevelEnum("level"), //  central, provincial, local
  provinceName: text("province_name"), // name of province
  districtName: text("district_name"), // name of district
  localBodyType: localBodyTypeEnum("local_body_type"),// municipality, metro, rural municipality
  localBodyName: text("local_body_name"), // name of local body like sunwarshi, Pathari etc
  regionScope: regionScopeEnum("region_scope"), // scope of schema weather for district, province, national
  sourceUrl: text("source_url"), // url of source
  documentUrl: text("document_url"), // contain cloudinary url of document
  status: schemeStatusEnum("status"), // status like active, expired, upcoming
  publishedDate: date("published_date"), // date of publication
  expiryDate: date("expiry_date"), // date of expiry
  createdAt: timestamp("created_at").defaultNow().notNull(), // date of creation
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // date of update
});
