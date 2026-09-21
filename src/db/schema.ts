import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  canonicalName: text("canonical_name").notNull(),
  targetMuscleGroup: text("target_muscle_group").notNull(),
  category: text("category", { enum: ["COMPOUND", "ISOLATION"] }).notNull().default("COMPOUND"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // Formato ISO YYYY-MM-DD
  title: text("title"),
  rawInputText: text("raw_input_text").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const workoutExercises = sqliteTable("workout_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
});

export const exerciseSets = sqliteTable("exercise_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutExerciseId: integer("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  setType: text("set_type", { enum: ["WARMUP", "TOP_SET", "WORKING", "BACKOFF"] })
    .notNull()
    .default("WORKING"),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  rpe: real("rpe"),
  rir: integer("rir"),
  restSeconds: integer("rest_seconds"),
  estimated1rm: real("estimated_1rm").notNull(),
  volumeLoad: real("volume_load").notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type NewExerciseSet = typeof exerciseSets.$inferInsert;
