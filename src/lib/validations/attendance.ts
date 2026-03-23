import { z } from "zod";

export const toggleAttendanceSchema = z.object({
	restaurantId: z.string().uuid(),
});
