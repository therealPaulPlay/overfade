export default function init() {
    if (typeof window === 'undefined') return console.warn("Overfade is only supported in browser environments.");

    const resizeObserver = new ResizeObserver(entries => entries.forEach(entry => updateElement(entry.target)));

    function createMask(scroll, remaining, length, sides) {
        const masks = [];
        const fade = 8 * length;

        if (sides.left || sides.right) {
            const lf = sides.left ? Math.min(scroll.x / (15 * length), 1) : 0;
            const rf = sides.right ? Math.min(remaining.x / (15 * length), 1) : 0;

            masks.push(`linear-gradient(to right,
        rgba(0,0,0,${1 - lf}) 0%, rgba(0,0,0,${1 - 0.674 * lf}) ${fade * 0.25}%,
        rgba(0,0,0,${1 - 0.446 * lf}) ${fade * 0.44}%, rgba(0,0,0,${1 - 0.26 * lf}) ${fade * 0.62}%,
        rgba(0,0,0,${1 - 0.14 * lf}) ${fade * 0.81}%, rgba(0,0,0,${1 - 0.046 * lf}) ${fade}%,
        black ${fade * 1.12}%, black ${100 - fade * 1.12}%,
        rgba(0,0,0,${0.954 * rf + 1 - rf}) ${100 - fade}%, rgba(0,0,0,${0.86 * rf + 1 - rf}) ${100 - fade * 0.81}%,
        rgba(0,0,0,${0.74 * rf + 1 - rf}) ${100 - fade * 0.62}%, rgba(0,0,0,${0.554 * rf + 1 - rf}) ${100 - fade * 0.44}%,
        rgba(0,0,0,${0.326 * rf + 1 - rf}) ${100 - fade * 0.25}%, rgba(0,0,0,${1 - rf}) 100%)`);
        }

        if (sides.top || sides.bottom) {
            const tf = sides.top ? Math.min(scroll.y / (15 * length), 1) : 0;
            const bf = sides.bottom ? Math.min(remaining.y / (15 * length), 1) : 0;

            masks.push(`linear-gradient(to bottom,
        rgba(0,0,0,${1 - tf}) 0%, rgba(0,0,0,${1 - 0.674 * tf}) ${fade * 0.25}%,
        rgba(0,0,0,${1 - 0.446 * tf}) ${fade * 0.44}%, rgba(0,0,0,${1 - 0.26 * tf}) ${fade * 0.62}%,
        rgba(0,0,0,${1 - 0.14 * tf}) ${fade * 0.81}%, rgba(0,0,0,${1 - 0.046 * tf}) ${fade}%,
        black ${fade * 1.12}%, black ${100 - fade * 1.12}%,
        rgba(0,0,0,${0.954 * bf + 1 - bf}) ${100 - fade}%, rgba(0,0,0,${0.86 * bf + 1 - bf}) ${100 - fade * 0.81}%,
        rgba(0,0,0,${0.74 * bf + 1 - bf}) ${100 - fade * 0.62}%, rgba(0,0,0,${0.554 * bf + 1 - bf}) ${100 - fade * 0.44}%,
        rgba(0,0,0,${0.326 * bf + 1 - bf}) ${100 - fade * 0.25}%, rgba(0,0,0,${1 - bf}) 100%)`);
        }

        return masks.join(', ');
    }

    function updateElement(el) {
        const classes = el.classList;
        const length = parseFloat([...classes].find(c => c.startsWith('of-length-'))?.split('-')[2]) || 1;
        const sides = {
            top: classes.contains('of-top'),
            bottom: classes.contains('of-bottom'),
            left: classes.contains('of-left'),
            right: classes.contains('of-right')
        };

        // Return if the element has no overfade classes
        if (!Object.values(sides).some(Boolean)) {
            if (el._overfadeHandler) {
                // If it previously had overfade classes, remove the event listener and observer
                el.removeEventListener('scroll', el._overfadeHandler);
                el._overfadeHandler = undefined;
                el.style.maskImage = '';
                resizeObserver.unobserve(el);
            }
            return;
        }

        resizeObserver.observe(el);

        const update = () => {
            const scroll = { x: el.scrollLeft, y: el.scrollTop };
            const remaining = {
                x: el.scrollWidth - el.clientWidth - scroll.x,
                y: el.scrollHeight - el.clientHeight - scroll.y
            };

            const mask = createMask(scroll, remaining, length, sides);
            el.style.maskImage = mask;
            if ((sides.left || sides.right) && (sides.top || sides.bottom)) el.style.maskComposite = 'intersect';
        };

        if (el._overfadeHandler) el.removeEventListener('scroll', el._overfadeHandler);
        el._overfadeHandler = update; // Assign handler, so that removing it becomes possible
        el.addEventListener('scroll', update, { passive: true });
        update();
    }

    new MutationObserver(mutations => {
        mutations.forEach(({ type, target, addedNodes, attributeName }) => {
            if (type === 'attributes' && attributeName === 'class') updateElement(target);
            if (type === 'childList') {
                addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        updateElement(node); // Update parent node
                        node.querySelectorAll?.('*').forEach(updateElement); // And update all children
                    }
                });
            }
        });
    }).observe(document.body, { childList: true, subtree: true, attributes: true });

    if (document.readyState !== 'loading') {
        document.querySelectorAll('*').forEach(updateElement);
    } else {
        document.addEventListener('DOMContentLoaded', () =>
            document.querySelectorAll('*').forEach(updateElement)
        );
    }
};