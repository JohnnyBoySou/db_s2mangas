import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    // Log all queries and errors
    log: ['query', 'info', 'warn', 'error'],

    // Configure database connection
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },

    // Configure query error handling
    errorFormat: 'pretty',

    // Configure connection pool
    /* connection: {
       pool: {
         min: 3,
         max: 10
       }
     }
       */
})

async function testConnection() {
    try {
        await prisma.$connect()
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso')
        return {
            [Symbol.asyncDispose]: async () => {
                await prisma.$disconnect()
                console.log('✅ Conexão com o banco de dados encerrada')
            }
        }
    } catch (error) {
        console.error('❌ Falha na conexão com o banco de dados:', error)
        process.exit(1)
    }
}

testConnection()
//await using db = await testConnection()

export default prisma
