import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "./schema";

pgGenerate({ schema, out: "./docs/schema.dbml", relational: false });
