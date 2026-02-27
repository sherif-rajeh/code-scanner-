(function () {
  // Check if we're on mobile device
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window);
  }

  // Check if we're specifically on iOS
  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }


  // Main detection logic - run only once when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Disable right-click context menu (more selective on mobile)
    document.addEventListener('contextmenu', function(e) {
        // On iOS, be more permissive with context menus
        if (isIOSDevice()) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor') ||
                                target.closest('.form-control');
            
            const isInteractiveElement = target.closest('button') ||
                                        target.closest('a') ||
                                        target.closest('.btn') ||
                                        target.tagName === 'IMG';
            
            if (isInputField || isInteractiveElement) {
                return true; // Allow context menu on interactive elements on iOS
            }
        }
        // On other mobile devices, allow context menu for input fields for better UX
        else if (isMobileDevice()) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor') ||
                                target.closest('.form-control');
            
            if (isInputField) {
                return true; // Allow context menu on input fields on mobile
            }
        }
        
        e.preventDefault();
        return false;
    });

    // iOS-specific touch event handling
    if (isIOSDevice()) {
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            const touchDuration = Date.now() - touchStartTime;
            const target = e.target;
            
            // Prevent long-press context menu on non-interactive elements
            if (touchDuration > 500) { // Long press detected
                const isInputField = target.tagName === 'INPUT' ||
                                    target.tagName === 'TEXTAREA' ||
                                    target.contentEditable === 'true' ||
                                    target.closest('.ql-editor') ||
                                    target.closest('.form-control');
                
                const isInteractiveElement = target.closest('button') ||
                                            target.closest('a') ||
                                            target.closest('.btn') ||
                                            target.tagName === 'IMG';
                
                if (!isInputField && !isInteractiveElement) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }

    // Additional protection against save functionality
    // Disable browser's save functionality through various methods
    document.addEventListener('keydown', function(e) {
        // Prevent Ctrl+Shift+S (Save As) in all browsers
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Prevent Ctrl+S (Save) in all browsers
        if (e.ctrlKey && !e.shiftKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true); // Use capture phase for better prevention

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
    document.addEventListener('keydown', function(e) {
        // On iOS, be more permissive with keyboard events
        if (isIOSDevice()) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor') ||
                                target.closest('.form-control');
            
            // Allow most keyboard events on iOS for better UX
            if (isInputField) {
                return true;
            }
            
            // Only block specific developer shortcuts on iOS
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) {
                e.preventDefault();
                return false;
            }
            
            return true; // Allow other keys on iOS
        }

        const target = e.target;
        const isInputField = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true' ||
                            target.closest('.ql-editor') || // Quill editor
                            target.closest('.swal2-popup'); // SweetAlert popups

        // Allow common editing shortcuts in input fields
        if (isInputField) {
            // Allow Ctrl+C (Copy), Ctrl+V (Paste), Ctrl+X (Cut), Ctrl+Z (Undo), Ctrl+Y (Redo)
            if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88 || e.keyCode === 90 || e.keyCode === 89)) {
                return true; // Allow these shortcuts in input fields
            }
        }
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Tab key - Prevent navigation to iframe elements (YouTube, etc.)
        if (e.keyCode === 9) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.tagName === 'SELECT' ||
                                target.tagName === 'BUTTON' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor') ||
                                target.closest('.form-control') ||
                                target.closest('.btn') ||
                                target.closest('.swal2-popup') ||
                                target.closest('a[href]');

            // Check if next focusable element would be an iframe or inside an iframe
            const focusableElements = document.querySelectorAll(
                'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            );

            const currentIndex = Array.from(focusableElements).indexOf(target);
            let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

            if (nextIndex >= 0 && nextIndex < focusableElements.length) {
                const nextElement = focusableElements[nextIndex];

                // Prevent tabbing to iframe elements or elements inside video containers
                if (nextElement.tagName === 'IFRAME' ||
                    nextElement.closest('.video-container') ||
                    nextElement.closest('.videojs-container') ||
                    nextElement.closest('.vdocipher-container') ||
                    nextElement.closest('.google-drive-video') ||
                    nextElement.closest('.thevideo')) {
                    e.preventDefault();

                    // Find next safe element to focus
                    let safeIndex = nextIndex + (e.shiftKey ? -1 : 1);
                    while (safeIndex >= 0 && safeIndex < focusableElements.length) {
                        const safeElement = focusableElements[safeIndex];
                        if (safeElement.tagName !== 'IFRAME' &&
                            !safeElement.closest('.video-container') &&
                            !safeElement.closest('.videojs-container') &&
                            !safeElement.closest('.vdocipher-container') &&
                            !safeElement.closest('.google-drive-video') &&
                            !safeElement.closest('.thevideo')) {
                            safeElement.focus();
                            break;
                        }
                        safeIndex += e.shiftKey ? -1 : 1;
                    }
                    return false;
                }
            }

            // Allow normal tab behavior for safe elements
            if (isInputField) {
                return true;
            }
        }

        // Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+S (Save Page As)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }

        // Alt+F4 (Close Window) - Can be used to bypass some protections
        if (e.altKey && e.keyCode === 115) {
            e.preventDefault();
            return false;
        }

        // F1 (Help) - Sometimes used to access browser features
        if (e.keyCode === 112) {
            e.preventDefault();
            return false;
        }

        // Ctrl+A (Select All) - Allow in input fields, textareas, and contenteditable elements
        if (e.ctrlKey && e.keyCode === 65) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor'); // Quill editor

            if (!isInputField) {
                e.preventDefault();
                return false;
            }
        }

        // Ctrl+P (Print)
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    });

    // Disable text selection - Allow in input fields, textareas, and contenteditable elements
    document.onselectstart = function(e) {
        // On iOS, be more permissive with text selection for better UX
        if (isIOSDevice()) {
            const target = e.target;
            const isInputField = target.tagName === 'INPUT' ||
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('.ql-editor') ||
                                target.closest('.form-control') ||
                                target.closest('.swal2-popup');
            
            // Allow text selection in more elements on iOS
            const isInteractiveElement = target.closest('button') ||
                                        target.closest('a') ||
                                        target.closest('.btn') ||
                                        target.closest('.item-card') ||
                                        target.closest('.sortable-item');
            
            if (isInputField || isInteractiveElement) {
                return true;
            }
            
            // Still prevent selection of main content on iOS
            return false;
        }

        const target = e.target;
        const isInputField = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true' ||
                            target.closest('.ql-editor') || // Quill editor
                            target.closest('.form-control') || // Bootstrap form controls
                            target.closest('.swal2-popup'); // SweetAlert popups

        // Allow text selection in sortable items for better UX
        const isSortableItem = target.closest('.item-card') || // Lecture items
                              target.closest('.sortable-item') || // General sortable items
                              target.closest('.lecture-item') || // Lecture specific items
                              target.closest('.course-item') || // Course specific items
                              target.closest('.video-item') || // Video items
                              target.closest('.document-item') || // Document items
                              target.closest('.exam-item'); // Exam items

        if (isInputField || isSortableItem) {
            return true; // Allow selection in input fields and sortable items
        }
        return false; // Prevent selection elsewhere
    };

    document.onmousedown = function(e) {
        const target = e.target;
        const isInputField = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.tagName === 'SELECT' ||
                            target.contentEditable === 'true' ||
                            target.closest('.ql-editor') || // Quill editor
                            target.closest('.form-control') || // Bootstrap form controls
                            target.closest('.swal2-popup') || // SweetAlert popups
                            target.closest('button') || // Allow button clicks
                            target.closest('a') || // Allow link clicks
                            target.closest('.btn'); // Allow Bootstrap button clicks

        // Allow mouse down for sortable items in lectures and courses
        const isSortableItem = target.closest('.item-card') || // Lecture items
                              target.closest('.sortable-item') || // General sortable items
                              target.closest('.lecture-item') || // Lecture specific items
                              target.closest('.course-item') || // Course specific items
                              target.closest('.video-item') || // Video items
                              target.closest('.document-item') || // Document items
                              target.closest('.exam-item') || // Exam items
                              target.closest('[draggable="true"]') || // Any explicitly draggable element
                              target.closest('.ui-sortable') || // jQuery UI sortable
                              target.closest('.sortable') || // SortableJS elements
                              target.closest('#selected-items-container') || // Selected items container
                              target.closest('.drag-handle'); // Drag handles

        if (isInputField || isSortableItem) {
            return true; // Allow mouse down in input fields, interactive elements, and sortable items
        }
        return false; // Prevent mouse down elsewhere
    };

    // Disable drag and drop - Allow for input fields, file uploads, and sortable items
    document.ondragstart = function(e) {
        const target = e.target;
        const isInputField = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true' ||
                            target.closest('.ql-editor') || // Quill editor
                            target.closest('.upload-area') || // File upload areas
                            target.closest('.form-control'); // Bootstrap form controls

        // Allow drag and drop for sortable items in lectures and courses
        const isSortableItem = target.closest('.item-card') || // Lecture items
                              target.closest('.sortable-item') || // General sortable items
                              target.closest('.lecture-item') || // Lecture specific items
                              target.closest('.course-item') || // Course specific items
                              target.closest('.video-item') || // Video items
                              target.closest('.document-item') || // Document items
                              target.closest('.exam-item') || // Exam items
                              target.closest('[draggable="true"]') || // Any explicitly draggable element
                              target.closest('.ui-sortable') || // jQuery UI sortable
                              target.closest('.sortable') || // SortableJS elements
                              target.closest('#selected-items-container') || // Selected items container
                              target.closest('.drag-handle') || // Drag handles
                              target.hasAttribute('draggable'); // Elements with draggable attribute

        if (isInputField || isSortableItem) {
            return true; // Allow drag in input fields and sortable items
        }
        return false; // Prevent drag elsewhere
    };

    // Additional protection for video containers
    const videoContainers = document.querySelectorAll('.video-container, .videojs-container, .vdocipher-container');
    videoContainers.forEach(container => {
        container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        container.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        });

        container.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        });
    });

    // Detect developer tools
    let devtools = {
        open: false,
        orientation: null
    };

    const threshold = 160;

    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                //console.clear();
                console.log('%cتحذير!', 'color: red; font-size: 50px; font-weight: bold;');
                console.log('%cهذه ميزة متصفح مخصصة للمطورين. إذا طلب منك شخص ما نسخ ولصق شيء هنا لتمكين ميزة أو "اختراق" حساب شخص ما، فهذا احتيال وسيمنحه إمكانية الوصول إلى حسابك.', 'color: red; font-size: 16px;');
            }
        } else {
            devtools.open = false;
        }
    }, 500);

    // Additional protection against save functionality
    // Prevent Alt key (used to access browser menu)
    document.addEventListener('keydown', function(e) {
        if (e.altKey && !e.target.closest('.form-control') && !e.target.closest('input') && !e.target.closest('textarea')) {
            e.preventDefault();
            return false;
        }
    });

    // Override window.print to prevent printing/save as PDF
    const originalPrint = window.print;
    window.print = function() {
        console.log('Print function disabled for security');
        return false;
    };

    // Disable browser's beforeunload to prevent save prompts
    window.addEventListener('beforeunload', function(e) {
        // Don't show save dialog
        delete e['returnValue'];
    });

    // Additional protection against text selection (except in input fields)
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' &&
            e.target.tagName !== 'TEXTAREA' &&
            !e.target.closest('.ql-editor') &&
            !e.target.closest('.form-control') &&
            !e.target.closest('.swal2-popup')) {
            e.preventDefault();
            return false;
        }
    });

    // Prevent browser zoom which can be used to bypass some protections
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            return false;
        }
    });

    // Prevent keyboard zoom
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
            e.preventDefault();
            return false;
        }
    });

    // Prevent F11 (Fullscreen) which can be used to hide browser UI
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F11' || e.keyCode === 122) {
            e.preventDefault();
            return false;
        }
    });

    // Additional protection against Ctrl+Shift+S (Save As) with modern event handling
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // Prevent access to browser developer menu via F10
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F10' || e.keyCode === 121) {
            e.preventDefault();
            return false;
        }
    });

  });
})();