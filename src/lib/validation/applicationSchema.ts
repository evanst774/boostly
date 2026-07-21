// src/lib/validation/applicationSchema.ts
import { z } from 'zod';

export const personalInfoSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().min(1, 'Please select a gender'),
    nationality: z.string().min(1, 'Nationality is required'),
});

export const addressSchema = z.object({
    address: z.string().min(5, 'Address is required'),
    province: z.string().min(2, 'Province is required'),
    district: z.string().min(2, 'District is required'),
    sector: z.string().min(2, 'Sector is required'),
});

export const educationSchema = z.object({
    previousSchool: z.string().min(2, 'Previous school is required'),
    previousSchoolLocation: z.string().optional(),
    graduationYear: z.string().min(4, 'Graduation year is required'),
    qualifications: z.string().optional(),
});

export const applicationDetailsSchema = z.object({
    program: z.string().min(1, 'Please select a program'),
    startDate: z.string().min(1, 'Start date is required'),
    heardAbout: z.string().optional(),
    additionalInfo: z.string().optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ApplicationDetails = z.infer<typeof applicationDetailsSchema>;