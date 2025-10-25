import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	ssl: true,
	tlsAllowInvalidCertificates: false,
	serverSelectionTimeoutMS: 5000,
});
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MongoDB: ", error);
		process.exit(1); // exit process with failure, 0 for success
	}
};
