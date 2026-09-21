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

export const workoutRoutines = sqliteTable("workout_routines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  splitType: text("split_type").notNull().default("UPPER_LOWER"), // UPPER_LOWER, PPL, PPL_UPPER_LOWER, BRO_SPLIT, CUSTOM
  name: text("name").notNull(),
  letter: text("letter").notNull().default("A"),
  dayLabel: text("day_label"),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const routineExercises = sqliteTable("routine_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routineId: integer("routine_id")
    .notNull()
    .references(() => workoutRoutines.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  targetSets: integer("target_sets").notNull().default(3),
  targetRepsMin: integer("target_reps_min").notNull().default(8),
  targetRepsMax: integer("target_reps_max").notNull().default(10),
  targetRpe: real("target_rpe"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type NewExerciseSet = typeof exerciseSets.$inferInsert;
export type WorkoutRoutine = typeof workoutRoutines.$inferSelect;
export type NewWorkoutRoutine = typeof workoutRoutines.$inferInsert;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;

import { relations } from "drizzle-orm";

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
  routineExercises: many(routineExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(exerciseSets),
}));

export const exerciseSetsRelations = relations(exerciseSets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [exerciseSets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const workoutRoutinesRelations = relations(workoutRoutines, ({ many }) => ({
  routineExercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(workoutRoutines, {
    fields: [routineExercises.routineId],
    references: [workoutRoutines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));
