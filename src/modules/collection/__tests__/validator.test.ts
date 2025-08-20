import {
    addCollaboratorSchema,
    removeCollaboratorSchema,
    updateCollaboratorRoleSchema,
    listCollaboratorsSchema,
    collectionIdParamSchema,
    userIdParamSchema,
} from '../validators/CollaboratorValidator';

describe('CollaboratorValidator', () => {
    describe('addCollaboratorSchema', () => {
        it('should validate valid data with default role', () => {
            const validData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
            };

            const result = addCollaboratorSchema.parse(validData);

            expect(result).toEqual({
                ...validData,
                role: 'EDITOR', // default value
            });
        });

        it('should validate valid data with explicit role', () => {
            const validData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'ADMIN' as const,
            };

            const result = addCollaboratorSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid collectionId', () => {
            const invalidData = {
                collectionId: 'invalid-uuid',
                userId: '123e4567-e89b-12d3-a456-426614174001',
            };

            expect(() => addCollaboratorSchema.parse(invalidData)).toThrow(
                'ID da coleção deve ser um UUID válido'
            );
        });

        it('should throw error for invalid userId', () => {
            const invalidData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: 'invalid-uuid',
            };

            expect(() => addCollaboratorSchema.parse(invalidData)).toThrow(
                'ID do usuário deve ser um UUID válido'
            );
        });

        it('should throw error for invalid role', () => {
            const invalidData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'INVALID_ROLE',
            };

            expect(() => addCollaboratorSchema.parse(invalidData)).toThrow();
        });
    });

    describe('removeCollaboratorSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
            };

            const result = removeCollaboratorSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid collectionId', () => {
            const invalidData = {
                collectionId: 'invalid-uuid',
                userId: '123e4567-e89b-12d3-a456-426614174001',
            };

            expect(() => removeCollaboratorSchema.parse(invalidData)).toThrow(
                'ID da coleção deve ser um UUID válido'
            );
        });

        it('should throw error for invalid userId', () => {
            const invalidData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: 'invalid-uuid',
            };

            expect(() => removeCollaboratorSchema.parse(invalidData)).toThrow(
                'ID do usuário deve ser um UUID válido'
            );
        });
    });

    describe('updateCollaboratorRoleSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'ADMIN' as const,
            };

            const result = updateCollaboratorRoleSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid collectionId', () => {
            const invalidData = {
                collectionId: 'invalid-uuid',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'ADMIN' as const,
            };

            expect(() => updateCollaboratorRoleSchema.parse(invalidData)).toThrow(
                'ID da coleção deve ser um UUID válido'
            );
        });

        it('should throw error for invalid userId', () => {
            const invalidData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: 'invalid-uuid',
                role: 'ADMIN' as const,
            };

            expect(() => updateCollaboratorRoleSchema.parse(invalidData)).toThrow(
                'ID do usuário deve ser um UUID válido'
            );
        });

        it('should throw error for invalid role', () => {
            const invalidData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174001',
                role: 'INVALID_ROLE',
            };

            expect(() => updateCollaboratorRoleSchema.parse(invalidData)).toThrow();
        });
    });

    describe('listCollaboratorsSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                collectionId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = listCollaboratorsSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid collectionId', () => {
            const invalidData = {
                collectionId: 'invalid-uuid',
            };

            expect(() => listCollaboratorsSchema.parse(invalidData)).toThrow(
                'ID da coleção deve ser um UUID válido'
            );
        });
    });

    describe('collectionIdParamSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = collectionIdParamSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid id', () => {
            const invalidData = {
                id: 'invalid-uuid',
            };

            expect(() => collectionIdParamSchema.parse(invalidData)).toThrow(
                'ID da coleção deve ser um UUID válido'
            );
        });
    });

    describe('userIdParamSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                userId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = userIdParamSchema.parse(validData);

            expect(result).toEqual(validData);
        });

        it('should throw error for invalid userId', () => {
            const invalidData = {
                userId: 'invalid-uuid',
            };

            expect(() => userIdParamSchema.parse(invalidData)).toThrow(
                'ID do usuário deve ser um UUID válido'
            );
        });
    });
});