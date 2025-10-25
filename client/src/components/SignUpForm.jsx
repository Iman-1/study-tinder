import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

const SignUpForm = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [gender, setGender] = useState("");
	const [age, setAge] = useState("");
	const [genderPreference, setGenderPreference] = useState("");
	const [courses, setCourses] = useState([]);
	const [courseInput, setCourseInput] = useState("");

	const { signup, loading } = useAuthStore();

	// --- Logic for Handling Course Input ---
const handleCourseChange = (e) => {
    // Convert to uppercase for consistency (e.g., mat137 -> MAT137)
    const value = e.target.value.toUpperCase();

    // Allow letters and numbers, and limit the length to 6
    if (/^[A-Z0-9]*$/.test(value) && value.length <= 6) {
        setCourseInput(value);
        
        // When 6 characters are entered, add it to the courses array
        if (value.length === 6) {
            if (!courses.includes(value)) {
                setCourses([...courses, value]);
            }
            // Clear the input field for the next course
            setCourseInput("");
        }
    }
};

const removeCourse = (courseToRemove) => {
    setCourses(courses.filter((course) => course !== courseToRemove));
};

	return (
		<form
			className='space-y-6'
			onSubmit={(e) => {
				e.preventDefault();
				signup({ name, email, password, gender, age, genderPreference });
			}}
		>
			{/* NAME */}
			<div>
				<label htmlFor='name' className='block text-sm font-medium text-gray-700'>
					Name
				</label>
				<div className='mt-1'>
					<input
						id='name'
						name='name'
						type='text'
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm'
					/>
				</div>
			</div>

			{/* EMAIL */}
			<div>
				<label htmlFor='email' className='block text-sm font-medium text-gray-700'>
					Email address
				</label>
				<div className='mt-1'>
					<input
						id='email'
						name='email'
						type='email'
						autoComplete='email'
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm'
					/>
				</div>
			</div>

			{/* PASSWORD */}
			<div>
				<label htmlFor='password' className='block text-sm font-medium text-gray-700'>
					Password
				</label>
				<div className='mt-1'>
					<input
						id='password'
						name='password'
						type='password'
						autoComplete='new-password'
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm'
					/>
				</div>
			</div>

			{/* AGE */}
			<div>
				<label htmlFor='age' className='block text-sm font-medium text-gray-700'>
					Age
				</label>
				<div className='mt-1'>
					<input
						id='age'
						name='age'
						type='number'
						required
						value={age}
						onChange={(e) => setAge(e.target.value)}
						min='18'
						max='120'
						className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm'
					/>
				</div>
			</div>

			{/* GENDER */}
			<div>
				<label className='block text-sm font-medium text-gray-700'>Your Gender</label>
				<div className='mt-2 flex gap-2'>
					<div className='flex items-center'>
						<input
							id='male'
							name='gender'
							type='checkbox'
							checked={gender === "male"}
							onChange={() => setGender("male")}
							className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
						/>
						<label htmlFor='male' className='ml-2 block text-sm text-gray-900'>
							Male
						</label>
					</div>
					<div className='flex items-center'>
						<input
							id='female'
							name='gender'
							type='checkbox'
							checked={gender === "female"}
							onChange={() => setGender("female")}
							className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded'
						/>
						<label htmlFor='female' className='ml-2 block text-sm text-gray-900'>
							Female
						</label>
					</div>
				</div>
			</div>

			{/* GENDER PREFERENCE */}
			<div>
				<label className='block text-sm font-medium text-gray-700'>Preferance</label>
				<div className='mt-2 space-y-2'>
					<div className='flex items-center'>
						<input
							id='prefer-male'
							name='gender-preference'
							type='radio'
							value='male'
							checked={genderPreference === "male"}
							onChange={(e) => setGenderPreference(e.target.value)}
							className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300'
						/>
						<label htmlFor='prefer-male' className='ml-2 block text-sm text-gray-900'>
							Male
						</label>
					</div>
					<div className='flex items-center'>
						<input
							id='prefer-female'
							name='gender-preference'
							type='radio'
							value='female'
							checked={genderPreference === "female"}
							onChange={(e) => setGenderPreference(e.target.value)}
							className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300'
						/>
						<label htmlFor='prefer-female' className='ml-2 block text-sm text-gray-900'>
							Female
						</label>
					</div>
					<div className='flex items-center'>
						<input
							id='prefer-both'
							name='gender-preference'
							type='radio'
							value='both'
							checked={genderPreference === "both"}
							onChange={(e) => setGenderPreference(e.target.value)}
							className='h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300'
						/>
						<label htmlFor='prefer-both' className='ml-2 block text-sm text-gray-900'>
							Both
						</label>
					</div>
				</div>
			</div>

			{/* CURRENT COURSES */}
            <div>
                <label htmlFor='courses' className='block text-sm font-medium text-gray-700'>
                    Your Courses
                </label>
                <p className="text-xs text-gray-500 mb-2">Enter the 6-digit course code below.</p>

                {/* This div displays the course tags */}
                <div className='flex flex-wrap gap-2 mb-2'>
                    {courses.map((course) => (
                        <div key={course} className='flex items-center bg-pink-100 text-pink-800 text-sm font-medium px-3 py-1 rounded-full'>
                            <span>{course}</span>
                            <button
                                type='button'
                                onClick={() => removeCourse(course)}
                                className='ml-2 -mr-1 text-pink-600 hover:text-pink-800'
                                aria-label={`Remove ${course}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className='mt-1'>
                    <input
                        id='courses-input'
                        name='courses-input'
                        type='text'
                        placeholder="Type 6 digits..."
                        value={courseInput}
                        onChange={handleCourseChange}
                        className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm'
                    />
                </div>
            </div>

			<div>
				<button
					type='submit'
					className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
						loading
							? "bg-pink-400 cursor-not-allowed"
							: "bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
					}`}
					disabled={loading}
				>
					{loading ? "Signing up..." : "Sign up"}
				</button>
			</div>
		</form>
	);
};
export default SignUpForm;
