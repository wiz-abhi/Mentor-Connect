import fs from "fs"
import path from "path"
import { query } from "../lib/db"
import 'dotenv/config'

async function migrate() {
  try {
    console.log("Starting database migration...")

    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // Get list of applied migrations
    const { rows: appliedMigrations } = await query("SELECT name FROM migrations")
    const appliedMigrationNames = appliedMigrations.map((m) => m.name)

    // Get all migration files
    const migrationsDir = path.join(__dirname, "migrations")
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort() // Ensure migrations are applied in order

    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`)

        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, "utf8")

        // Start a transaction
        await query("BEGIN")

        try {
          // Apply the migration
          await query(sql)

          // Record the migration
          await query("INSERT INTO migrations (name) VALUES ($1)", [file])

          // Commit the transaction
          await query("COMMIT")

          console.log(`Migration ${file} applied successfully`)
        } catch (error) {
          // Rollback on error
          await query("ROLLBACK")
          console.error(`Error applying migration ${file}:`, error)
          throw error
        }
      } else {
        console.log(`Migration ${file} already applied, skipping`)
      }
    }

    console.log("Database migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

migrate()

