import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';

const TourGuide = ({ startTour, setStartTour }) => {
    const navigate = useNavigate();

    const steps = [
        {
            target: 'body',
            content: 'Welcome to the Landfill Detection System! Let’s take a tour of the key features. Click "Next" to begin.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: 'body',
            content: 'This is the Dashboard. Here you can get an overview of recent detections and system status.',
            placement: 'center',
            before: () => navigate('/'),
        },
        {
            target: 'body',
            content: 'The Upload page allows you to upload images for landfill detection. The system will process the images using a YOLO model.',
            placement: 'center',
            before: () => navigate('/upload'),
        },
        {
            target: '.history-table',
            content: 'The Detection History page shows a list of all processed images, their detection counts, and statuses.',
            placement: 'top',
            before: () => navigate('/history'),
        },
        {
            target: 'body',
            content: 'The Real-Time Analysis page streams live detection results from images in the system.',
            placement: 'center',
            before: () => navigate('/realtime'),
        },
        {
            target: 'body',
            content: 'You’re back on the Demo page! You can explore demo data here. This concludes our tour. Enjoy using the system!',
            placement: 'center',
            before: () => navigate('/demo'),
        },
    ];

    const handleJoyrideCallback = (data) => {
        const { status, action, index } = data;

        if (action === 'next' && steps[index + 1]?.before) {
            steps[index + 1].before();
        } else if (action === 'prev' && steps[index - 1]?.before) {
            steps[index - 1].before();
        }

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setStartTour(false);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={startTour}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#2C3E50',
                    textColor: '#333',
                    zIndex: 1000,
                },
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip',
            }}
        />
    );
};

export default TourGuide;
