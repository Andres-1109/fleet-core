import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Single source of truth for the database connection.
 * Used by the TypeORM CLI (migration:* scripts) and imported by AppModule.
 *
 * The schema is managed exclusively through migrations: `synchronize` must
 * stay false in every environment.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Globs resolve to .ts under ts-node (CLI) and .js in the compiled build.
  entities: [__dirname + '/../modules/**/*.orm-entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
