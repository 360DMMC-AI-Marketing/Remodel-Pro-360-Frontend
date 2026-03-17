import { z } from "zod"

const addressSchema = z.object({
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	zipCode: z.string().min(1, "Zip code is required"),
	coordinates: z.object({
		type: z.literal("Point"),
		coordinates: z.tuple([z.number(), z.number()]),
	}).optional(),
}).optional();

const budgetRangeSchema = z.object({
	min: z.number().min(0),
	max: z.number().min(0),
}).optional();

const imageSchema = z.object({
	id: z.string(),
	file: z.any(), // File object
	preview: z.string(),
});

export const projectSchema = z.object({
	roomType: z.string().min(1, "Room type is required"),
	title: z.string().min(3, "Title must be at least 3 characters"),
	description: z.string().min(10, "Description must be at least 10 characters"),
	address: addressSchema,
	budgetRange: budgetRangeSchema,
	customBudget: z.number().positive("Budget must be positive").optional(),
	startDate: z.date().optional(),
	attachedDesignId: z.string().nullable().optional(),
	images: z.array(imageSchema),
});

export type ProjectForm = z.infer<typeof projectSchema>;