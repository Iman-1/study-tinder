import { useRef, useState } from "react";
import { Header } from "../components/Header";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";

const AvailabilitySelector = ({ availability, setAvailability }) => {
    const [isDragging, setIsDragging] = useState(false);
    // 'dragMode' determines if we are selecting or deselecting during a drag
    const [dragMode, setDragMode] = useState(null); 

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = Array.from({ length: 12 }, (_, i) => {
        const hour = i + 8;
        if (hour === 12) return "12 PM";
        if (hour > 12) return `${hour - 12} PM`;
        return `${hour} AM`;
    });

    // This function starts the drag action
    const handleMouseDown = (slotId) => {
        setIsDragging(true);
        const isSelected = availability.includes(slotId);
        
        // If the first cell clicked is already selected, we start deselecting.
        // Otherwise, we start selecting.
        const currentDragMode = isSelected ? 'deselect' : 'select';
        setDragMode(currentDragMode);

        // Apply the initial action to the clicked cell
        updateSlot(slotId, currentDragMode);
    };

    // This function is called as the mouse moves over other cells
    const handleMouseEnter = (slotId) => {
        if (isDragging) {
            updateSlot(slotId, dragMode);
        }
    };
    
    // This function stops the drag action
    const handleMouseUp = () => {
        setIsDragging(false);
        setDragMode(null);
    };

    // Helper function to add or remove a slot without duplication
    const updateSlot = (slotId, mode) => {
        setAvailability(prev => {
            const isSelected = prev.includes(slotId);
            if (mode === 'select' && !isSelected) {
                return [...prev, slotId];
            }
            if (mode === 'deselect' && isSelected) {
                return prev.filter(s => s !== slotId);
            }
            return prev; // No change needed
        });
    };

    return (
        <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
                Your Weekly Availability (Click and drag to select)
            </label>
            {/* onMouseUp and onMouseLeave on the container ensure the drag stops even if the mouse leaves the grid */}
            <div 
                className='grid grid-cols-8 gap-0 text-center border-t border-l border-gray-200 select-none'
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Header Row */}
                <div className='border-b border-r border-gray-200 py-1 text-xs font-bold text-gray-600'>Time</div>
                {days.map(day => <div key={day} className='border-b border-r border-gray-200 py-1 text-xs font-bold text-gray-600'>{day}</div>)}

                {/* Grid Rows for each hour */}
                {times.map((time) => (
                    <div key={time} className='contents'>
                        <div className='border-b border-r border-gray-200 p-1 text-xs font-bold text-gray-600 flex items-center justify-center'>{time}</div>
                        {days.map((day) => {
                            const slotId = `${day}-${time.replace(" ", "")}`;
                            const isSelected = availability.includes(slotId);
                            return (
                                <div
                                    key={slotId}
                                    // Start dragging on mouse down
                                    onMouseDown={() => handleMouseDown(slotId)}
                                    // Continue dragging on mouse enter
                                    onMouseEnter={() => handleMouseEnter(slotId)}
                                    className={`border-b border-r border-gray-200 h-6 cursor-pointer transition-colors duration-150 ${
                                        isSelected ? "bg-pink-500" : "bg-white hover:bg-pink-100"
                                    }`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfilePage = () => {
	const { authUser } = useAuthStore();
	const [name, setName] = useState(authUser.name || "");
	const [bio, setBio] = useState(authUser.bio || "");
	const [age, setAge] = useState(authUser.age || "");
	const [gender, setGender] = useState(authUser.gender || "");
	const [genderPreference, setGenderPreference] = useState(authUser.genderPreference || []);
	const [image, setImage] = useState(authUser.image || null);
	const [courses, setCourses] = useState(authUser.courses || []);
    const [courseInput, setCourseInput] = useState("");
    const [availability, setAvailability] = useState(authUser.availability || []);

	const fileInputRef = useRef(null);

	const { loading, updateProfile } = useUserStore();
	const handleCourseChange = (e) => {
        setCourseInput(e.target.value.toUpperCase());
    };

    const handleCourseKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newCourse = courseInput.trim();
            if (newCourse && !courses.includes(newCourse)) {
                setCourses([...courses, newCourse]);
                setCourseInput("");
            }
        }
    };

    const removeCourse = (courseToRemove) => {
        setCourses(courses.filter((course) => course !== courseToRemove));
    };

	const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile({ 
            name, 
            bio, 
            age, 
            gender, 
            genderPreference, 
            image,
            courses, // Send courses
            availability // Send availability
        });
    };

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImage(reader.result);
			};

			reader.readAsDataURL(file);
		}
	};

	console.log(image);

	return (
		<div className='min-h-screen bg-gray-50 flex flex-col'>
			<Header />

			<div className='flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>Your Profile</h2>
				</div>

				<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
					<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200'>
						<form onSubmit={handleSubmit} className='space-y-6'>
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
										className='appearance-none block w-full px-3 py-2 border border-gray-300
										 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#825644] focus:border-[#825644] 
										sm:text-sm'
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
										className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#825644] focus:border-[#825644] sm:text-sm'
									/>
								</div>
							</div>

							{/* GENDER */}
							<div>
								<span className='block text-sm font-medium text-gray-700 mb-2'>Gender</span>
								<div className='flex space-x-4'>
									{["Male", "Female"].map((option) => (
										<label key={option} className='inline-flex items-center'>
											<input
												type='radio'
												className='form-radio text-[#825644]'
												name='gender'
												value={option.toLowerCase()}
												checked={gender === option.toLowerCase()}
												onChange={() => setGender(option.toLowerCase())}
											/>
											<span className='ml-2'>{option}</span>
										</label>
									))}
								</div>
							</div>

							{/* GENDER PREFERENCE */}
							<div>
								<span className='block text-sm font-medium text-gray-700 mb-2'>Gender Preference</span>
								<div className='flex space-x-4'>
									{["Male", "Female", "Both"].map((option) => (
										<label key={option} className='inline-flex items-center'>
											<input
												type='checkbox'
												className='form-checkbox text-[#825644]'
												checked={genderPreference.toLowerCase() === option.toLowerCase()}
												onChange={() => setGenderPreference(option.toLowerCase())}
											/>
											<span className='ml-2'>{option}</span>
										</label>
									))}
								</div>
							</div>

							{/* BIO */}

							<div>
								<label htmlFor='bio' className='block text-sm font-medium text-gray-700'>
									Bio
								</label>
								<div className='mt-1'>
									<textarea
										id='bio'
										name='bio'
										rows={3}
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#825644] focus:border-[#825644] sm:text-sm'
									/>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700'>Cover Image</label>
								<div className='mt-1 flex items-center'>
									<button
										type='button'
										onClick={() => fileInputRef.current.click()}
										className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#825644]'
									>
										Upload Image
									</button>
									<input
										ref={fileInputRef}
										type='file'
										accept='image/*'
										className='hidden'
										onChange={handleImageChange}
									/>
								</div>
							</div>

							{image && (
								<div className='mt-4'>
									<img src={image} alt='User Image' className='w-48 h-full object-cover rounded-md' />
								</div>
							)}

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#825644] hover:bg-[#825644] 
								focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#825644]'
								disabled={loading}
							>
								{loading ? "Saving..." : "Save"}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};
export default ProfilePage;
