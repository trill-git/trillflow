// =====================================================
// TRILL FLOW CHANNELS
// WhatsApp-Style Chat System
// Complete JavaScript
// Image Attachment Support
// FULL EMOJI PICKER
// =====================================================

(() => {

    // =====================================================
    // GLOBAL SINGLETON PROTECTION
    // =====================================================

    const GLOBAL_KEY = "__TRILL_FLOW_CHANNELS__";

    if (window[GLOBAL_KEY]?.initialized) {

        console.warn(
            "⚠️ TRILL FLOW CHANNELS already initialized."
        );

        if (
            typeof window[GLOBAL_KEY].stopPolling ===
            "function"
        ) {
            window[GLOBAL_KEY].stopPolling();
        }
    }


    // =====================================================
    // STATE
    // =====================================================

    const ChannelsState =
        window[GLOBAL_KEY]?.state ||
        {

            channels: [],

            users: [],

            currentChannel: null,

            messages: [],

            editingChannel: false,

            polling: null,

            pollingChannelId: null,

            pollingRequestRunning: false,

            lastMessageId: null,

            lastMessagesSignature: null,

            deleteModalOpen: false,

            currentUser: null,

            editingMessageId: null,

            deletingMessageId: null,

            editMessageModalOpen: false,

            deleteMessageModalOpen: false,

            initialized: false,

            eventsBound: false,

            initPromise: null,

            // =================================================
            // ATTACHMENTS
            // =================================================

            selectedFiles: [],

            uploadingFiles: false,

            // =================================================
            // EMOJI
            // =================================================

            emojiPickerOpen: false,

            selectedEmojiCategory: "smileys",

            emojiSearch: ""

        };


    // =====================================================
    // GLOBAL INSTANCE
    // =====================================================

    window[GLOBAL_KEY] = {

        state: ChannelsState,

        initialized: false,

        stopPolling: stopMessagePolling

    };


    // =====================================================
    // DOM READY
    // =====================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initChannels,
            {
                once: true
            }
        );

    } else {

        initChannels();

    }


    // =====================================================
    // API
    // =====================================================

    async function channelAPI(
        url,
        options = {}
    ) {

        const fetchOptions = {

            credentials: "include",

            ...options

        };


        if (
            !(options.body instanceof FormData)
        ) {

            fetchOptions.headers = {

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            };

        } else {

            fetchOptions.headers = {

                ...(options.headers || {})

            };

        }


        const isPollingRequest =
            options.__polling === true;


        if (!isPollingRequest) {



        }


        delete fetchOptions.__polling;


        const response =
            await fetch(
                url,
                fetchOptions
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data = null;

        }


        if (!isPollingRequest) {



        }


        if (!response.ok) {

            showMessage(
                data?.message ||
                data?.error ||
                `HTTP ${response.status}`,
                "error"
            );

        }


        return data;

    }


    // =====================================================
    // INIT
    // =====================================================

    async function initChannels() {

        if (
            ChannelsState.initPromise
        ) {

            return ChannelsState.initPromise;

        }


        if (
            ChannelsState.initialized
        ) {



            return;

        }


        ChannelsState.initPromise =
            (async () => {


                stopMessagePolling();


                setupChannelEvents();


                setupAttachmentSystem();


                setupEmojiPicker();



                refreshIcons();


                await loadCurrentUser();


                await loadUsers();


                await loadChannels();


                updateMembersVisibility();


                ChannelsState.initialized =
                    true;


                window[GLOBAL_KEY].initialized =
                    true;




            })();


        try {

            await ChannelsState.initPromise;

        } catch (error) {

            ChannelsState.initPromise =
                null;


            console.error(
                "❌ CHANNELS INIT ERROR:",
                error
            );


            throw error;

        }

    }


    // =====================================================
    // ELEMENT
    // =====================================================

    function el(id) {

        return document.getElementById(id);

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function setupChannelEvents() {

        if (
            ChannelsState.eventsBound
        ) {

            return;

        }


        ChannelsState.eventsBound =
            true;

        // =================================================
        // CREATE CHANNEL
        // =================================================

        const createButton =
            el("createChannelBtn");


        if (createButton) {

            createButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openChannelModal();

                }
            );

        }


        // =================================================
        // CLOSE CHANNEL MODAL
        // =================================================

        el("closeChannelModal")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeChannelModal();

                }
            );


        // =================================================
        // CANCEL CHANNEL
        // =================================================

        el("cancelChannelBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeChannelModal();

                }
            );


        // =================================================
        // CHANNEL FORM
        // =================================================

        el("channelForm")
            ?.addEventListener(
                "submit",
                saveChannel
            );


        // =================================================
        // SEARCH
        // =================================================

        el("channelSearch")
            ?.addEventListener(
                "input",
                renderChannels
            );


        // =================================================
        // CHANNEL IMAGE
        // =================================================

        el("channelImage")
            ?.addEventListener(
                "change",
                previewChannelImage
            );


        // =================================================
        // PRIVACY
        // =================================================

        document
            .querySelectorAll(
                'input[name="channelPrivacy"]'
            )
            .forEach(
                radio => {

                    radio.addEventListener(
                        "change",
                        updateMembersVisibility
                    );

                }
            );


        // =================================================
        // CHAT FORM
        // =================================================

        el("channelMessageForm")
            ?.addEventListener(
                "submit",
                sendChannelMessage
            );


        // =================================================
        // ENTER TO SEND
        // =================================================

        el("channelMessageInput")
            ?.addEventListener(
                "keydown",
                event => {

                    if (

                        event.key ===
                        "Enter" &&

                        !event.shiftKey

                    ) {

                        event.preventDefault();

                        el("channelMessageForm")
                            ?.requestSubmit();

                    }

                }
            );


        // =================================================
        // EDIT CHANNEL
        // =================================================

        el("editChannelBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const channel =
                        ChannelsState.currentChannel;


                    if (!channel) {

                        return;

                    }


                    openChannelModal(
                        channel
                    );

                }
            );


        // =================================================
        // DELETE CHANNEL
        // =================================================

        el("deleteChannelBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    openDeleteChannelModal();

                }
            );


        // =================================================
        // DELETE MODAL
        // =================================================

        const deleteModal =
            el("deleteChannelModal");


        if (deleteModal) {

            const modalBox =
                deleteModal.querySelector(
                    ".delete-channel-modal"
                );


            if (modalBox) {

                modalBox.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                    }
                );

            }


            deleteModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        deleteModal
                    ) {

                        closeDeleteChannelModal();

                    }

                }
            );

        }


        // =================================================
        // CONFIRM DELETE
        // =================================================

        el("confirmDeleteChannelBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    confirmDeleteChannel();

                }
            );


        // =================================================
        // CANCEL DELETE
        // =================================================

        el("cancelDeleteChannelBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    closeDeleteChannelModal();

                }
            );


        // =================================================
        // MEMBERS
        // =================================================

        el("channelMembersBtn")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openMembersModal();

                }
            );


        // =================================================
        // CLOSE MEMBERS
        // =================================================

        el("closeMembersModal")
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    el("membersModal")
                        ?.classList
                        .add("hidden");

                }
            );


        // =================================================
        // MESSAGE ACTIONS
        // =================================================

        const messagesContainer =
            el("channelMessages");


        if (messagesContainer) {

            messagesContainer.addEventListener(
                "click",
                handleMessageAction
            );

        }



    }


    // =====================================================
    // EMOJI PICKER
    // =====================================================

    function setupEmojiPicker() {

        const input =
            el("channelMessageInput");


        const form =
            el("channelMessageForm");


        if (!input || !form) {

            console.warn(
                "⚠️ Emoji picker: message input/form not found."
            );

            return;

        }


        // =================================================
        // FIND EXISTING BUTTON
        // =================================================

        let emojiButton =
            el("channelEmojiBtn") ||
            el("emojiPickerBtn") ||
            document.querySelector(
                "[data-channel-emoji]"
            );


        // =================================================
        // CREATE BUTTON AUTOMATICALLY
        // =================================================

        if (!emojiButton) {

            emojiButton =
                document.createElement(
                    "button"
                );


            emojiButton.type =
                "button";


            emojiButton.id =
                "channelEmojiBtn";


            emojiButton.className =
                "channel-emoji-btn";


            emojiButton.setAttribute(
                "aria-label",
                "اختيار إيموجي"
            );


            emojiButton.setAttribute(
                "title",
                "إيموجي"
            );


            emojiButton.innerHTML =
                "😊";


            // =================================================
            // TRY TO PLACE NEXT TO INPUT
            // =================================================

            const inputParent =
                input.parentElement;


            if (inputParent) {

                inputParent.insertBefore(
                    emojiButton,
                    input
                );

            } else {

                form.prepend(
                    emojiButton
                );

            }

        }


        // =================================================
        // BUTTON EVENT
        // =================================================

        if (
            !emojiButton.dataset.emojiBound
        ) {

            emojiButton.dataset.emojiBound =
                "true";


            emojiButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    toggleEmojiPicker(
                        emojiButton,
                        input
                    );

                }
            );

        }


        // =================================================
        // CREATE PICKER
        // =================================================

        createEmojiPicker();


        // =================================================
        // CLOSE WHEN CLICKING OUTSIDE
        // =================================================

        if (
            !document.body.dataset.emojiOutsideBound
        ) {

            document.body.dataset.emojiOutsideBound =
                "true";


            document.addEventListener(
                "click",
                event => {

                    const picker =
                        el("trillEmojiPicker");


                    const button =
                        el("channelEmojiBtn");


                    if (!picker) {

                        return;

                    }


                    if (
                        !picker.contains(
                            event.target
                        ) &&
                        !button?.contains(
                            event.target
                        )
                    ) {

                        closeEmojiPicker();

                    }

                }
            );

        }


        // =================================================
        // ESCAPE
        // =================================================

        if (
            !document.body.dataset.emojiEscapeBound
        ) {

            document.body.dataset.emojiEscapeBound =
                "true";


            document.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Escape"
                    ) {

                        closeEmojiPicker();

                    }

                }
            );

        }




    }


    // =====================================================
    // EMOJI DATA
    // =====================================================

    const EMOJI_CATEGORIES = {

        smileys: {

            name: "وجوه",

            icon: "😀",

            emojis: [

                "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
                "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
                "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
                "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
                "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
                "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
                "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
                "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢",
                "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "😑",
                "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱",
                "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮",
                "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿",
                "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽",
                "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼",
                "😽", "🙀", "😿", "😾"

            ]

        },


        people: {

            name: "أشخاص",

            icon: "👋",

            emojis: [

                "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️",
                "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇",
                "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
                "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳",
                "💪", "🦾", "🦿", "🦵", "🦶", "👂", "👃", "🧠",
                "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄",
                "💋", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨",
                "🧔", "👨‍🦰", "👨‍🦱", "👨‍🦳", "👨‍🦲", "👩",
                "👩‍🦰", "👩‍🦱", "👩‍🦳", "👩‍🦲", "🧓", "👴", "👵",
                "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🧏", "🙇",
                "🤦", "🤷", "👮", "🕵️", "💂", "🥷", "👷", "🤴",
                "👸", "👳", "👲", "🧕", "🤵", "👰", "🤰", "🫃",
                "🫄", "🤱", "👼", "🎅", "🤶", "🧑‍🎄", "🧙", "🧚",
                "🧛", "🧜", "🧝", "🧞", "🧟", "💇", "💆", "🚶",
                "🏃", "💃", "🕺", "🧘", "🏄", "🏊", "🤽", "🚴",
                "🤸", "🤼", "🤹", "🧗", "⛹️", "🏋️", "🤾", "🏌️"

            ]

        },


        animals: {

            name: "حيوانات",

            icon: "🐶",

            emojis: [

                "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
                "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
                "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
                "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
                "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞",
                "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂",
                "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐",
                "🦀", "🐠", "🐟", "🐡", "🦈", "🐳", "🐋", "🐬",
                "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘",
                "🦏", "🦛", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃",
                "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐",
                "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶",
                "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊️"

            ]

        },


        food: {

            name: "طعام",

            icon: "🍔",

            emojis: [

                "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇",
                "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
                "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️",
                "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠",
                "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳",
                "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭",
                "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮",
                "🌯", "🫔", "🥗", "🥘", "🫕", "🍝", "🍜", "🍲",
                "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚",
                "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨",
                "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬",
                "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛",
                "☕", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻",
                "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🧊"

            ]

        },


        activities: {

            name: "نشاط",

            icon: "⚽",

            emojis: [

                "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
                "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
                "🏏", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋",
                "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂",
                "🏋️", "🤼", "🤸", "🤾", "⛹️", "🤺", "🏇", "🧘",
                "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🎯",
                "🎮", "🕹️", "🎰", "🎲", "🧩", "♟️", "🎨", "🎭",
                "🎪", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺",
                "🎸", "🪕", "🎻", "🎬", "🎞️", "📽️", "🎟️", "🎫",
                "🏆", "🏅", "🥇", "🥈", "🥉", "🏆", "🏵️", "🎖️",
                "🎗️", "🎉", "🎊", "🎈", "🎂", "🎁", "🎀", "🎄"

            ]

        },


        travel: {

            name: "سفر",

            icon: "🚗",

            emojis: [

                "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
                "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️",
                "🚲", "🛴", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡",
                "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅",
                "🚈", "🚂", "✈️", "🛫", "🛬", "🛩️", "💺", "🚁",
                "🚀", "🛸", "🚢", "⛵", "🛶", "🚤", "🛥️", "🗺️",
                "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢",
                "🎠", "🏖️", "🏝️", "🏜️", "🌋", "⛺", "🗻", "🏕️",
                "🏠", "🏡", "🏢", "🏥", "🏦", "🏨", "🏪", "🏫",
                "🏭", "🏛️", "⛪", "🕌", "🕋", "🛣️", "🛤️", "🌁",
                "🌃", "🌆", "🌇", "🌉", "🌌", "🌠", "🎇", "🎆"

            ]

        },


        objects: {

            name: "أشياء",

            icon: "💡",

            emojis: [

                "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️",
                "💽", "💾", "💿", "📀", "📷", "📸", "📹", "🎥",
                "📞", "☎️", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
                "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "🔋", "🔌",
                "💡", "🔦", "🕯️", "🧯", "🛒", "💰", "💳", "🪙",
                "💎", "⚖️", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩",
                "⚙️", "🧲", "🔫", "💣", "🧨", "🔪", "🗡️", "🛡️",
                "🔑", "🗝️", "🔒", "🔓", "🔐", "🔏", "📎", "🖇️",
                "📌", "📍", "📏", "📐", "✂️", "📝", "✏️", "🖊️",
                "🖋️", "📖", "📚", "📓", "📒", "📃", "📄", "🗂️",
                "📁", "📂", "🗃️", "🗄️", "🗑️", "📦", "📫", "📮",
                "✉️", "📧", "📨", "📩", "📤", "📥", "📯", "🔔",
                "🔕", "📢", "📣", "📻", "💬", "💭", "🗯️", "💤"

            ]

        },


        symbols: {

            name: "رموز",

            icon: "❤️",

            emojis: [

                "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
                "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
                "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☯️",
                "☸️", "✡️", "🔯", "🕎", "☦️", "🛐", "⛎", "♈",
                "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
                "♑", "♒", "♓", "🆔", "⚛️", "☢️", "☣️", "📴",
                "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚",
                "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲",
                "❌", "⭕", "🛑", "⛔", "🚫", "💯", "‼️", "⁉️",
                "❓", "❔", "❕", "❗", "〰️", "💱", "♻️", "⚜️",
                "🔱", "🔰", "⭕", "✅", "☑️", "✔️", "❎", "➕",
                "➖", "➗", "✖️", "♾️", "💲", "©️", "®️", "™️",
                "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪",
                "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "▪️",
                "▫️", "◾", "◽", "◼️", "◻️", "⬛", "⬜", "⭐",
                "🌟", "✨", "⚡", "🔥", "💥", "💫", "🌈", "☀️",
                "🌙", "☁️", "❄️", "☃️", "🌧️", "🌩️", "🌪️", "🌊"

            ]

        }

    };


    // =====================================================
    // CREATE EMOJI PICKER
    // =====================================================

    function createEmojiPicker() {

        if (
            el("trillEmojiPicker")
        ) {

            return;

        }


        const form =
            el("channelMessageForm");


        if (!form) {

            return;

        }


        const picker =
            document.createElement(
                "div"
            );


        picker.id =
            "trillEmojiPicker";


        picker.className =
            "trill-emoji-picker hidden";


        picker.innerHTML = `

            <div class="trill-emoji-header">

                <div class="trill-emoji-title">

                    <span>الإيموجي</span>

                </div>


                <button
                    type="button"
                    class="trill-emoji-close"
                    aria-label="إغلاق"
                >

                    ×

                </button>

            </div>


            <div class="trill-emoji-search">

                <span>🔍</span>

                <input
                    type="text"
                    id="trillEmojiSearch"
                    placeholder="البحث عن إيموجي..."
                    autocomplete="off"
                >

            </div>


            <div
                class="trill-emoji-categories"
                id="trillEmojiCategories"
            ></div>


            <div
                class="trill-emoji-grid"
                id="trillEmojiGrid"
            ></div>

        `;


        form.appendChild(
            picker
        );


        // =================================================
        // CLOSE
        // =================================================

        picker
            .querySelector(
                ".trill-emoji-close"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    closeEmojiPicker();

                }
            );


        // =================================================
        // SEARCH
        // =================================================

        picker
            .querySelector(
                "#trillEmojiSearch"
            )
            ?.addEventListener(
                "input",
                event => {

                    ChannelsState.emojiSearch =
                        event.target.value
                            .trim()
                            .toLowerCase();


                    renderEmojiGrid();

                }
            );


        renderEmojiCategories();

        renderEmojiGrid();

    }


    // =====================================================
    // RENDER EMOJI CATEGORIES
    // =====================================================

    function renderEmojiCategories() {

        const container =
            el(
                "trillEmojiCategories"
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            Object.entries(
                EMOJI_CATEGORIES
            )
                .map(
                    ([key, category]) => {

                        const active =
                            key ===
                                ChannelsState
                                    .selectedEmojiCategory
                                ? "active"
                                : "";


                        return `

                            <button
                                type="button"
                                class="trill-emoji-category ${active}"
                                data-emoji-category="${escapeAttribute(key)}"
                                title="${escapeAttribute(category.name)}"
                            >

                                ${category.icon}

                            </button>

                        `;

                    }
                )
                .join("");


        container
            .querySelectorAll(
                "[data-emoji-category]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


                            ChannelsState
                                .selectedEmojiCategory =
                                button.dataset
                                    .emojiCategory;


                            ChannelsState
                                .emojiSearch =
                                "";


                            const search =
                                el(
                                    "trillEmojiSearch"
                                );


                            if (search) {

                                search.value =
                                    "";

                            }


                            renderEmojiCategories();

                            renderEmojiGrid();

                        }
                    );

                }
            );

    }


    // =====================================================
    // RENDER EMOJI GRID
    // =====================================================

    function renderEmojiGrid() {

        const container =
            el(
                "trillEmojiGrid"
            );


        if (!container) {

            return;

        }


        let emojis =
            [];


        // =================================================
        // SEARCH ALL CATEGORIES
        // =================================================

        if (
            ChannelsState.emojiSearch
        ) {

            emojis =
                Object.values(
                    EMOJI_CATEGORIES
                )
                    .flatMap(
                        category =>
                            category.emojis
                    );

        } else {

            emojis =
                EMOJI_CATEGORIES[
                    ChannelsState
                        .selectedEmojiCategory
                ]?.emojis || [];

        }


        // Remove duplicates

        emojis =
            [...new Set(emojis)];


        if (!emojis.length) {

            container.innerHTML = `

                <div class="trill-emoji-empty">

                    لا يوجد إيموجي

                </div>

            `;

            return;

        }


        container.innerHTML =
            emojis
                .map(
                    emoji => `

                        <button
                            type="button"
                            class="trill-emoji-item"
                            data-emoji="${escapeAttribute(emoji)}"
                            title="${escapeAttribute(emoji)}"
                        >

                            ${emoji}

                        </button>

                    `
                )
                .join("");


        container
            .querySelectorAll(
                "[data-emoji]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


                            insertEmoji(
                                button.dataset.emoji
                            );

                        }
                    );

                }
            );

    }


    // =====================================================
    // TOGGLE EMOJI PICKER
    // =====================================================

    function toggleEmojiPicker(
        button,
        input
    ) {

        const picker =
            el(
                "trillEmojiPicker"
            );


        if (!picker) {

            return;

        }


        if (
            ChannelsState.emojiPickerOpen
        ) {

            closeEmojiPicker();

            return;

        }


        ChannelsState.emojiPickerOpen =
            true;


        picker.classList.remove(
            "hidden"
        );


        button.classList.add(
            "active"
        );


        // Keep cursor in input

        input.focus();


        // =================================================
        // SCROLL TO BOTTOM OF PICKER
        // =================================================

        requestAnimationFrame(
            () => {

                const grid =
                    el(
                        "trillEmojiGrid"
                    );


                if (grid) {

                    grid.scrollTop =
                        0;

                }

            }
        );

    }


    // =====================================================
    // CLOSE EMOJI PICKER
    // =====================================================

    function closeEmojiPicker() {

        const picker =
            el(
                "trillEmojiPicker"
            );


        const button =
            el(
                "channelEmojiBtn"
            );


        ChannelsState.emojiPickerOpen =
            false;


        if (picker) {

            picker.classList.add(
                "hidden"
            );

        }


        if (button) {

            button.classList.remove(
                "active"
            );

        }

    }


    // =====================================================
    // INSERT EMOJI
    // =====================================================

    function insertEmoji(
        emoji
    ) {

        const input =
            el(
                "channelMessageInput"
            );


        if (!input || !emoji) {

            return;

        }


        const start =
            Number.isInteger(
                input.selectionStart
            )
                ? input.selectionStart
                : input.value.length;


        const end =
            Number.isInteger(
                input.selectionEnd
            )
                ? input.selectionEnd
                : input.value.length;


        const value =
            input.value;


        input.value =
            value.slice(
                0,
                start
            ) +

            emoji +

            value.slice(
                end
            );


        const newPosition =
            start +
            emoji.length;


        input.focus();


        try {

            input.setSelectionRange(
                newPosition,
                newPosition
            );

        } catch {

            // Ignore unsupported inputs

        }


        // =================================================
        // INPUT EVENT
        // =================================================

        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );

    }


    // =====================================================
    // ATTACHMENT SYSTEM
    // =====================================================

    function setupAttachmentSystem() {



        const attachButton =
            el("channelAttachBtn") ||
            el("attachFileBtn") ||
            el("channelAttachmentBtn") ||
            el("messageAttachBtn") ||
            document.querySelector(
                "[data-channel-attach]"
            );


        let fileInput =
            el("channelFileInput");


        if (!fileInput) {

            fileInput =
                document.createElement(
                    "input"
                );

            fileInput.type =
                "file";

            fileInput.id =
                "channelFileInput";

            fileInput.accept =
                "image/*";

            fileInput.multiple =
                true;

            fileInput.style.display =
                "none";


            document.body.appendChild(
                fileInput
            );

        } else {

            fileInput.accept =
                "image/*";

            fileInput.multiple =
                true;

        }


        if (attachButton) {

            if (
                !attachButton.dataset
                    .attachmentBound
            ) {

                attachButton.dataset
                    .attachmentBound =
                    "true";


                attachButton.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        fileInput.click();

                    }
                );

            }




        } else {



        }


        if (
            !fileInput.dataset
                .attachmentBound
        ) {

            fileInput.dataset
                .attachmentBound =
                "true";


            fileInput.addEventListener(
                "change",
                handleAttachmentSelection
            );

        }

    }


    // =====================================================
    // HANDLE ATTACHMENT SELECTION
    // =====================================================

    function handleAttachmentSelection(
        event
    ) {

        const files =
            Array.from(
                event.target.files || []
            );


        if (!files.length) {

            return;

        }


        const invalidFiles =
            files.filter(
                file =>
                    !file.type.startsWith(
                        "image/"
                    )
            );


        if (invalidFiles.length) {

            showMessage(
                "يمكنك إرفاق الصور فقط.",
                "warning"
            );
        }


        const validFiles =
            files.filter(
                file =>
                    file.type.startsWith(
                        "image/"
                    )
            );


        const maxSize =
            10 * 1024 * 1024;


        const oversized =
            validFiles.filter(
                file =>
                    file.size > maxSize
            );


        if (oversized.length) {

            showMessage(
                "حجم الصورة يجب ألا يتجاوز 10MB.",
                "warning"
            );

        }


        const finalFiles =
            validFiles.filter(
                file =>
                    file.size <= maxSize
            );


        ChannelsState.selectedFiles.push(
            ...finalFiles
        );


        renderAttachmentPreview();


        event.target.value =
            "";

    }


    // =====================================================
    // RENDER ATTACHMENT PREVIEW
    // =====================================================

    function renderAttachmentPreview() {

        const container =
            getAttachmentPreviewContainer();


        if (!container) {

            return;

        }


        if (
            !ChannelsState.selectedFiles.length
        ) {

            container.innerHTML =
                "";

            container.classList.add(
                "hidden"
            );

            return;

        }


        container.classList.remove(
            "hidden"
        );


        container.innerHTML =
            ChannelsState.selectedFiles
                .map(
                    (file, index) => {

                        const url =
                            URL.createObjectURL(
                                file
                            );


                        return `

                            <div
                                class="channel-attachment-preview"
                                data-file-index="${index}"
                            >

                                <img
                                    src="${escapeAttribute(url)}"
                                    alt="${escapeAttribute(file.name)}"
                                >

                                <button
                                    type="button"
                                    class="channel-attachment-remove"
                                    data-remove-file="${index}"
                                    title="إزالة الصورة"
                                >

                                    <i data-lucide="x"></i>

                                </button>

                                <span class="channel-attachment-name">

                                    ${escapeHTML(file.name)}

                                </span>

                            </div>

                        `;

                    }
                )
                .join("");


        container
            .querySelectorAll(
                "[data-remove-file]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


                            const index =
                                Number(
                                    button.dataset.removeFile
                                );


                            if (
                                Number.isInteger(index)
                            ) {

                                ChannelsState
                                    .selectedFiles
                                    .splice(
                                        index,
                                        1
                                    );

                            }


                            renderAttachmentPreview();

                        }
                    );

                }
            );


        refreshIcons();

    }


    // =====================================================
    // GET ATTACHMENT PREVIEW CONTAINER
    // =====================================================

    function getAttachmentPreviewContainer() {

        let container =
            el(
                "channelAttachmentPreview"
            );


        if (!container) {

            container =
                el(
                    "attachmentPreview"
                );

        }


        if (!container) {

            container =
                document.querySelector(
                    "[data-channel-attachment-preview]"
                );

        }


        if (!container) {

            const form =
                el(
                    "channelMessageForm"
                );


            if (!form) {

                return null;

            }


            container =
                document.createElement(
                    "div"
                );


            container.id =
                "channelAttachmentPreview";


            container.className =
                "channel-attachment-preview-container hidden";


            form.prepend(
                container
            );

        }


        return container;

    }


    // =====================================================
    // CLEAR ATTACHMENTS
    // =====================================================

    function clearAttachments() {

        ChannelsState.selectedFiles =
            [];


        const preview =
            getAttachmentPreviewContainer();


        if (preview) {

            preview.innerHTML =
                "";

            preview.classList.add(
                "hidden"
            );

        }


        const input =
            el(
                "channelFileInput"
            );


        if (input) {

            input.value =
                "";

        }

    }


    // =====================================================
    // MESSAGE ACTION HANDLER
    // =====================================================

    function handleMessageAction(
        event
    ) {

        const button =
            event.target.closest(
                "[data-message-action]"
            );


        if (!button) {

            return;

        }


        event.preventDefault();

        event.stopPropagation();


        const action =
            button.dataset.messageAction;


        const messageId =
            button.dataset.messageId;


        if (!messageId) {

            return;

        }


        if (
            action === "edit"
        ) {

            editChannelMessage(
                messageId
            );

            return;

        }


        if (
            action === "delete"
        ) {

            deleteChannelMessage(
                messageId
            );

            return;

        }


        if (
            action === "pin"
        ) {

            const pinned =
                button.dataset.pinned ===
                "true";


            togglePinMessage(
                messageId,
                !pinned
            );

        }

    }


    // =====================================================
    // PRIVACY / MEMBERS VISIBILITY
    // =====================================================

    function updateMembersVisibility() {

        const membersSection =
            el("channelMembersSection");


        const usersContainer =
            el("channelUsers");


        const selectedPrivacy =
            document.querySelector(
                'input[name="channelPrivacy"]:checked'
            );


        if (!selectedPrivacy) {

            return;

        }


        const isPrivate =
            selectedPrivacy.value ===
            "private";


        if (membersSection) {

            membersSection.classList.toggle(
                "hidden",
                !isPrivate
            );

        } else if (usersContainer) {

            usersContainer.classList.toggle(
                "hidden",
                !isPrivate
            );

        }


        if (!isPrivate) {

            document
                .querySelectorAll(
                    "#channelUsers input[type='checkbox']"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            false;

                    }
                );

        }

    }


    // =====================================================
    // LOAD CURRENT USER
    // =====================================================

    async function loadCurrentUser() {

        if (ChannelsState.currentUser?.id) {

            return ChannelsState.currentUser;

        }


        try {

            const data =
                await channelAPI(
                    "/user"
                );

            const user =
                data?.user || data;


            if (user?.id) {

                ChannelsState.currentUser =
                    user;

                window.currentUser =
                    user;

                window.currentUserRole =
                    user.role;

                return user;

            }

        } catch (error) {

            console.warn(
                "loadCurrentUser /user failed:",
                error
            );

        }


        try {

            const data =
                await channelAPI(
                    "/check-session"
                );


            if (data?.user?.id) {

                ChannelsState.currentUser =
                    data.user;

                window.currentUser =
                    data.user;

                window.currentUserRole =
                    data.user.role;

                return data.user;

            }

        } catch (error) {

            console.warn(
                "loadCurrentUser /check-session failed:",
                error
            );

        }


        return null;

    }


    // =====================================================
    // LOAD USERS
    // =====================================================

    async function loadUsers() {

        try {

            const data =
                await channelAPI(
                    "/users"
                );


            ChannelsState.users =
                Array.isArray(data)
                    ? data
                    : [];


            renderChannelUsers();

        } catch (error) {

            console.error(
                "❌ LOAD USERS:",
                error
            );

        }

    }


    // =====================================================
    // RENDER USERS
    // =====================================================

    function renderChannelUsers(
        selectedIds = []
    ) {

        const container =
            el("channelUsers");


        if (!container) {

            return;

        }


        if (
            !ChannelsState.users.length
        ) {

            container.innerHTML = `

                <div class="channels-loading">
                    لا يوجد أعضاء
                </div>

            `;

            return;

        }


        const selected =
            new Set(
                selectedIds.map(Number)
            );


        container.innerHTML =
            ChannelsState.users
                .map(user => {

                    const username =
                        user.username ||
                        "مستخدم";


                    const userId =
                        Number(user.id);


                    return `

                        <label class="channel-user">

                            <input
                                type="checkbox"
                                value="${escapeAttribute(
                        user.id
                    )}"
                                ${selected.has(userId)
                            ? "checked"
                            : ""
                        }
                            >

                            <div class="channel-user-info">

                                <strong>
                                    ${escapeHTML(username)}
                                </strong>

                            </div>

                        </label>

                    `;

                })
                .join("");


        updateMembersVisibility();

    }


    // =====================================================
    // LOAD CHANNELS
    // =====================================================

    async function loadChannels(
        options = {}
    ) {

        const silent =
            options?.silent === true;


        try {

            const data =
                await channelAPI(
                    "/channels",
                    {
                        __polling:
                            silent
                    }
                );


            ChannelsState.channels =
                Array.isArray(data)
                    ? data
                    : [];


            renderChannels();

        } catch (error) {

            if (!silent) {

                console.error(
                    "❌ LOAD CHANNELS:",
                    error
                );

            }


            const container =
                el("channelsList");


            if (
                container &&
                !silent
            ) {

                container.innerHTML = `

                    <div class="channels-loading">

                        فشل تحميل القنوات

                        <br><br>

                        <small>
                            ${escapeHTML(error.message)}
                        </small>

                    </div>

                `;

            }

        }

    }

    // =====================================================
    // RENDER CHANNELS
    // =====================================================

    function renderChannels() {

        const container =
            el("channelsList");


        if (!container) {

            return;

        }


        const search =
            (
                el("channelSearch")
                    ?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const channels =
            ChannelsState.channels.filter(
                channel => {

                    if (!search) {

                        return true;

                    }


                    return channel.name
                        ?.toLowerCase()
                        .includes(search);

                }
            );


        if (!channels.length) {

            container.innerHTML = `

                <div class="channels-loading">

                    <i data-lucide="hash"></i>

                    <br><br>

                    لا توجد قنوات

                </div>

            `;


            refreshIcons();

            return;

        }


        container.innerHTML =
            channels
                .map(channel => {

                    const active =
                        ChannelsState
                            .currentChannel
                            ?.id ==
                            channel.id
                            ? "active"
                            : "";


                    let image;


                    if (
                        channel.image_url
                    ) {

                        image = `

                   <img
    src="${escapeAttribute(
                            channel.image_url
                        )}"
    onload="console.log('✅ CHANNEL IMAGE LOADED:', this.src)"
                                alt="${escapeAttribute(
                            channel.name || ""
                        )}"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.style.display='none';
                                    this.parentElement.classList.add('image-error');
                                "
                            >

                        `;

                    } else {

                        image = `

                            <i data-lucide="hash"></i>

                        `;

                    }


                    const last =
                        channel.last_message
                            ?.message ||
                        "لا توجد رسائل";

                    return `

                        <div
                            class="channel-item ${active}"
                            data-channel-id="${escapeAttribute(
                        channel.id
                    )}"
                            role="button"
                            tabindex="0"
                        >

                            <div class="channel-item-image">

                                ${image}

                            </div>


                            <div class="channel-item-content">

                                <div class="channel-item-top">

                                    <span class="channel-item-name">

                                        ${channel.is_private
                            ? "🔒 "
                            : "# "
                        }

                                        ${escapeHTML(
                            channel.name || ""
                        )}

                                    </span>

                                </div>


                                <div class="channel-item-last">

                                    ${escapeHTML(last)}

                                </div>

                            </div>

                        </div>

                    `;

                })
                .join("");


        container
            .querySelectorAll(
                ".channel-item"
            )
            .forEach(item => {

                item.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        openChannel(
                            item.dataset.channelId
                        );

                    }
                );


                item.addEventListener(
                    "keydown",
                    event => {

                        if (

                            event.key ===
                            "Enter" ||

                            event.key ===
                            " "

                        ) {

                            event.preventDefault();


                            openChannel(
                                item.dataset.channelId
                            );

                        }

                    }
                );

            });


        refreshIcons();

    }


    // =====================================================
    // OPEN CHANNEL
    // =====================================================

    async function openChannel(
        channelId
    ) {

        if (!channelId) {

            return;

        }


        stopMessagePolling();


        closeEmojiPicker();


        try {

            if (!ChannelsState.currentUser) {

                await loadCurrentUser();

            }




            const channel =
                await channelAPI(
                    `/channels/${channelId}`
                );


            ChannelsState.currentChannel =
                channel;


            ChannelsState.messages =
                [];


            ChannelsState.lastMessageId =
                null;


            ChannelsState.lastMessagesSignature =
                null;


            clearAttachments();


            el("channelEmpty")
                ?.classList
                .add("hidden");


            el("channelChat")
                ?.classList
                .remove("hidden");


            renderChannelHeader(
                channel
            );


            renderChannels();


            await loadChannelMessages(
                channelId
            );


            startMessagePolling();

        } catch (error) {

            console.error(
                "❌ OPEN CHANNEL:",
                error
            );


            showMessage(
                error.message ||
                "فشل فتح القناة."
            );


        }

    }


    // =====================================================
    // CHANNEL HEADER
    // =====================================================

    function renderChannelHeader(
        channel
    ) {

        const name =
            el("channelHeaderName");


        const description =
            el("channelHeaderDescription");


        const image =
            el("channelHeaderImage");


        if (name) {

            name.textContent =
                channel.name || "";

        }


        if (description) {

            description.textContent =
                channel.description ||
                "لا يوجد وصف";

        }


        if (!image) {

            return;

        }


        if (
            channel.image_url
        ) {

            image.innerHTML = `

                <img
                    src="${escapeAttribute(
                channel.image_url
            )}"
                    alt="${escapeAttribute(
                channel.name || ""
            )}"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                    "
                >

            `;

        } else {

            image.innerHTML = `

                <i data-lucide="hash"></i>

            `;

        }


        refreshIcons();

    }


    // =====================================================
    // LOAD MESSAGES
    // =====================================================

    async function loadChannelMessages(
        channelId,
        silent = false
    ) {

        if (!channelId) {

            return;

        }


        if (

            ChannelsState.currentChannel &&

            Number(
                ChannelsState.currentChannel.id
            ) !==
            Number(channelId)

        ) {

            return;

        }


        try {

            const messages =
                await channelAPI(
                    `/channels/${channelId}/messages`,
                    {
                        __polling:
                            silent
                    }
                );


            const newMessages =
                Array.isArray(messages)
                    ? messages
                    : [];


            const signature =
                createMessagesSignature(
                    newMessages
                );


            if (

                silent &&

                signature ===
                ChannelsState.lastMessagesSignature

            ) {

                return;

            }


            const previousMessages =
                ChannelsState.messages || [];


            const hadMessages =
                previousMessages.length;


            const hadLastMessageId =
                ChannelsState.lastMessageId;


            ChannelsState.messages =
                newMessages;


            ChannelsState.lastMessagesSignature =
                signature;


            updateLastMessageId();


            const hasNewMessage =
                Boolean(
                    ChannelsState.lastMessageId &&
                    ChannelsState.lastMessageId !==
                    hadLastMessageId
                );


            renderMessages(
                silent
            );


            if (
                silent &&
                (
                    newMessages.length !==
                    hadMessages ||
                    hasNewMessage
                )
            ) {

                await loadChannels({
                    silent: true
                });

            }

        } catch (error) {

            if (!silent) {

                console.error(
                    "❌ LOAD MESSAGES:",
                    error
                );

            }

        }

    }


    // =====================================================
    // MESSAGE SIGNATURE
    // =====================================================

    function createMessagesSignature(
        messages
    ) {

        return messages
            .map(message => {

                return [

                    message.id,

                    message.message,

                    message.created_at,

                    message.edited_at,

                    message.is_pinned,

                    message.file_url,

                    message.attachment_url

                ].join("|");

            })
            .join("||");

    }


    // =====================================================
    // UPDATE LAST MESSAGE ID
    // =====================================================

    function updateLastMessageId() {

        const messages =
            ChannelsState.messages || [];


        if (!messages.length) {

            ChannelsState.lastMessageId =
                null;

            return;

        }


        const sorted =
            [...messages].sort(
                (a, b) =>
                    new Date(
                        a.created_at
                    ) -
                    new Date(
                        b.created_at
                    )
            );


        ChannelsState.lastMessageId =
            sorted[
                sorted.length - 1
            ]?.id ||
            null;

    }


    // =====================================================
    // RENDER MESSAGES — WHATSAPP STYLE
    // =====================================================

    function renderMessages(
        silent = false
    ) {

        const container =
            el("channelMessages");


        if (!container) {

            return;

        }


        const wasBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
            100;


        const messages =
            [...ChannelsState.messages]
                .sort(
                    (a, b) =>
                        new Date(
                            a.created_at
                        ) -
                        new Date(
                            b.created_at
                        )
                );


        let lastDateKey =
            null;


        const fragment =
            messages
                .map(message => {

                    const user =
                        message.users ||
                        {};


                    const username =
                        user.username ||
                        "مستخدم";


                    const currentUserId =
                        getCurrentUserId();


                    const currentRole =
                        String(
                            ChannelsState.currentUser?.role ||
                            window.currentUserRole ||
                            window.currentUser?.role ||
                            ""
                        ).toLowerCase();


                    const admin =
                        currentRole === "owner" ||
                        currentRole === "manager" ||
                        currentRole === "admin";


                    const own =
                        Boolean(
                            currentUserId &&
                            Number(message.user_id) === currentUserId
                        );


                    const canEdit =
                        own ||
                        admin;


                    const canDelete =
                        own ||
                        admin;


                    const messageDate =
                        new Date(
                            message.created_at
                        );


                    const dateKey =
                        getMessageDateKey(
                            messageDate
                        );


                    let dateSeparator =
                        "";


                    if (
                        dateKey !==
                        lastDateKey
                    ) {

                        dateSeparator = `

                            <div
                                class="chat-date-separator"
                                data-date="${escapeAttribute(
                            dateKey
                        )}"
                            >

                                <span>

                                    ${escapeHTML(
                            formatMessageDate(
                                messageDate
                            )
                        )}

                                </span>

                            </div>

                        `;


                        lastDateKey =
                            dateKey;

                    }


                    const initial =
                        getUserInitial(
                            username
                        );


                    const messageTime =
                        formatTime(
                            message.created_at
                        );


                    const messageText =
                        escapeHTML(
                            message.message ||
                            ""
                        );


                    const editedLabel =
                        message.edited_at
                            ? `

                                <small class="message-edited">

                                    معدلة

                                </small>

                            `
                            : "";


                    const attachmentUrl =
                        message.file_url ||
                        message.attachment_url ||
                        message.image_url ||
                        null;


                    let attachmentHTML =
                        "";


                    if (attachmentUrl) {

                        attachmentHTML = `

                            <div class="message-attachment">

                                <img
                                    src="${escapeAttribute(
                            attachmentUrl
                        )}"
                                    alt="صورة مرفقة"
                                    loading="lazy"
                                    onclick="window.open('${escapeAttribute(
                            attachmentUrl
                        )}', '_blank')"
                                >

                            </div>

                        `;

                    }


                    return `

                        ${dateSeparator}


                        <div
                            class="message ${own
                            ? "message-own"
                            : "message-other"
                        }"
                            data-message-id="${escapeAttribute(
                            message.id
                        )}"
                        >

                            <div class="message-avatar">

                                <span>

                                    ${escapeHTML(
                            initial
                        )}

                                </span>

                            </div>


                            <div class="message-content">

                                <div class="message-header">

                                    <span class="message-username">

                                        ${escapeHTML(
                            username
                        )}

                                    </span>

                                </div>


                                <div class="message-bubble">

                                    ${messageText
                            ? `

                                            <div class="message-text">

                                                ${messageText}

                                            </div>

                                        `
                            : ""
                        }


                                    ${attachmentHTML}


                                    <div class="message-meta">

                                        <span class="message-time">

                                            ${escapeHTML(
                            messageTime
                        )}

                                        </span>


                                        ${editedLabel}

                                    </div>


                                    <div class="message-actions">

                                        ${canEdit
                            ? `

                                                <button
                                                    type="button"
                                                    data-message-action="edit"
                                                    data-message-id="${escapeAttribute(
                                message.id
                            )}"
                                                    title="تعديل"
                                                >

                                                    <i data-lucide="pencil"></i>

                                                </button>

                                            `
                            : ""
                        }


                                        ${canDelete
                            ? `

                                                <button
                                                    type="button"
                                                    class="danger"
                                                    data-message-action="delete"
                                                    data-message-id="${escapeAttribute(
                                message.id
                            )}"
                                                    title="حذف"
                                                >

                                                    <i data-lucide="trash-2"></i>

                                                </button>

                                            `
                            : ""
                        }


                                        ${admin
                            ? `

                                                <button
                                                    type="button"
                                                    data-message-action="pin"
                                                    data-message-id="${escapeAttribute(
                                message.id
                            )}"
                                                    data-pinned="${message.is_pinned
                                ? "true"
                                : "false"
                            }"
                                                    title="${message.is_pinned
                                ? "إلغاء التثبيت"
                                : "تثبيت"
                            }"
                                                >

                                                    <i data-lucide="pin"></i>

                                                </button>

                                            `
                            : ""
                        }

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;

                })
                .join("");


        container.innerHTML =
            fragment;


        refreshIcons();


        if (
            !silent &&
            (
                wasBottom ||
                messages.length
            )
        ) {

            requestAnimationFrame(
                () => {

                    container.scrollTop =
                        container.scrollHeight;

                }
            );

        }

    }


    // =====================================================
    // MESSAGE DATE KEY
    // =====================================================

    function getMessageDateKey(
        date
    ) {

        return [

            date.getFullYear(),

            date.getMonth(),

            date.getDate()

        ].join("-");

    }


    // =====================================================
    // START OF DAY
    // =====================================================

    function startOfDay(
        date
    ) {

        return new Date(

            date.getFullYear(),

            date.getMonth(),

            date.getDate()

        );

    }


    // =====================================================
    // FORMAT MESSAGE DATE
    // =====================================================

    function formatMessageDate(
        date
    ) {

        if (
            !(date instanceof Date) ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        const now =
            new Date();


        const today =
            startOfDay(
                now
            );


        const messageDay =
            startOfDay(
                date
            );


        const difference =
            Math.floor(

                (
                    today -
                    messageDay
                ) /

                (
                    1000 *
                    60 *
                    60 *
                    24
                )

            );


        if (
            difference === 0
        ) {

            return "اليوم";

        }


        if (
            difference === 1
        ) {

            return "أمس";

        }


        if (
            difference >= 2 &&
            difference < 7
        ) {

            return date.toLocaleDateString(
                "ar-SA",
                {
                    weekday:
                        "long"
                }
            );

        }


        const sameYear =
            date.getFullYear() ===
            now.getFullYear();


        return date.toLocaleDateString(
            "ar-SA",
            {

                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long",

                ...(sameYear
                    ? {}
                    : {
                        year:
                            "numeric"
                    })

            }
        );

    }


    // =====================================================
    // FORMAT TIME
    // =====================================================

    function formatTime(
        date
    ) {

        if (!date) {

            return "";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "";

        }


        return parsed.toLocaleTimeString(
            "ar-SA",
            {

                hour:
                    "numeric",

                minute:
                    "2-digit"

            }
        );

    }


    // =====================================================
    // USER INITIAL
    // =====================================================

    function getUserInitial(
        username
    ) {

        const value =
            String(
                username ||
                "م"
            ).trim();


        if (!value) {

            return "م";

        }


        return value.charAt(0);

    }


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    async function sendChannelMessage(
        event
    ) {

        event.preventDefault();


        const channel =
            ChannelsState.currentChannel;


        if (!channel) {

            return;

        }


        const input =
            el("channelMessageInput");


        if (!input) {

            return;

        }


        const message =
            input.value.trim();


        const files =
            ChannelsState.selectedFiles || [];


        if (
            !message &&
            !files.length
        ) {

            return;

        }


        if (
            ChannelsState.uploadingFiles
        ) {

            return;

        }


        const submitButton =
            el("channelMessageSubmit") ||
            document.querySelector(
                '#channelMessageForm button[type="submit"]'
            );


        input.disabled =
            true;


        if (submitButton) {

            submitButton.disabled =
                true;

        }


        ChannelsState.uploadingFiles =
            true;


        try {

            // =================================================
            // SEND EACH IMAGE
            // =================================================

            if (files.length) {

                for (
                    const file of files
                ) {

                    const formData =
                        new FormData();


                    formData.append(
                        "file",
                        file
                    );


                    formData.append(
                        "message",
                        message
                    );


                    const response =
                        await fetch(

                            `/channels/${channel.id}/messages`,

                            {

                                method:
                                    "POST",

                                credentials:
                                    "include",

                                body:
                                    formData

                            }

                        );


                    let data =
                        null;


                    try {

                        data =
                            await response.json();

                    } catch {

                        data =
                            null;

                    }


                    if (!response.ok) {

                        throw new Error(

                            data?.message ||
                            data?.error ||
                            `HTTP ${response.status}`

                        );

                    }


                    if (data) {

                        const exists =
                            ChannelsState.messages.some(
                                item =>
                                    Number(
                                        item.id
                                    ) ===
                                    Number(
                                        data.id
                                    )
                            );


                        if (!exists) {

                            ChannelsState.messages.push(
                                data
                            );

                        }

                    }

                }

            } else {

                // =================================================
                // NORMAL TEXT MESSAGE
                // =================================================

                const data =
                    await channelAPI(

                        `/channels/${channel.id}/messages`,

                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    message
                                })

                        }

                    );


                if (data) {

                    const exists =
                        ChannelsState.messages.some(
                            item =>
                                Number(item.id) ===
                                Number(data.id)
                        );


                    if (!exists) {

                        ChannelsState.messages.push(
                            data
                        );

                    }

                }

            }


            // =================================================
            // CLEAR INPUT
            // =================================================

            input.value =
                "";


            clearAttachments();


            closeEmojiPicker();


            ChannelsState.lastMessagesSignature =
                createMessagesSignature(
                    ChannelsState.messages
                );


            updateLastMessageId();


            renderMessages();


            await loadChannels();


        } catch (error) {

            console.error(
                "❌ SEND MESSAGE:",
                error
            );


            showMessage(
                error.message ||
                "فشل إرسال الرسالة."
            );

        } finally {

            ChannelsState.uploadingFiles =
                false;


            input.disabled =
                false;


            if (submitButton) {

                submitButton.disabled =
                    false;

            }


            input.focus();

        }

    }


    // =====================================================
    // EDIT MESSAGE
    // =====================================================

    async function editChannelMessage(
        messageId
    ) {

        const message =
            ChannelsState.messages.find(
                item =>
                    Number(item.id) ===
                    Number(messageId)
            );


        if (!message) {

            return;

        }


        const newText =
            prompt(
                "تعديل الرسالة:",
                message.message
            );


        if (

            newText === null ||

            !newText.trim()

        ) {

            return;

        }


        try {

            await channelAPI(

                `/channels/${ChannelsState.currentChannel.id}/messages/${messageId}`,

                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify({

                            message:
                                newText.trim()

                        })

                }

            );


            await loadChannelMessages(

                ChannelsState
                    .currentChannel
                    .id

            );

        } catch (error) {

            console.error(
                "❌ EDIT MESSAGE:",
                error
            );


            showMessage(
                error.message ||
                "فشل تعديل الرسالة."
            );

        }

    }


    // =====================================================
    // DELETE MESSAGE
    // =====================================================

    async function deleteChannelMessage(
        messageId
    ) {

        if (
            !confirm(
                "هل تريد حذف الرسالة؟"
            )
        ) {

            return;

        }


        try {

            await channelAPI(

                `/channels/${ChannelsState.currentChannel.id}/messages/${messageId}`,

                {

                    method:
                        "DELETE"

                }

            );


            await loadChannelMessages(

                ChannelsState
                    .currentChannel
                    .id

            );

        } catch (error) {

            console.error(
                "❌ DELETE MESSAGE:",
                error
            );


            showMessage(
                error.message ||
                "فشل حذف الرسالة."
            );

        }

    }


    // =====================================================
    // PIN MESSAGE
    // =====================================================

    async function togglePinMessage(
        messageId,
        pinned
    ) {

        try {

            await channelAPI(

                `/channels/${ChannelsState.currentChannel.id}/messages/${messageId}/pin`,

                {

                    method:
                        "PATCH",

                    body:
                        JSON.stringify({
                            pinned
                        })

                }

            );


            await loadChannelMessages(

                ChannelsState
                    .currentChannel
                    .id

            );

        } catch (error) {

            console.error(
                "❌ PIN MESSAGE:",
                error
            );


            showMessage(
                error.message ||
                "فشل تثبيت الرسالة."
            );

        }

    }


    // =====================================================
    // CREATE / EDIT CHANNEL MODAL
    // =====================================================

    async function openChannelModal(
        channel = null
    ) {

        ChannelsState.editingChannel =
            Boolean(channel);


        const modal =
            el("channelModal");


        if (!modal) {

            return;

        }


        modal.classList.remove(
            "hidden"
        );


        modal.style.display =
            "flex";


        const title =
            el("channelModalTitle");


        if (title) {

            title.textContent =
                channel
                    ? "تعديل القناة"
                    : "إنشاء قناة";

        }


        const idInput =
            el("channelId");


        if (idInput) {

            idInput.value =
                channel?.id || "";

        }


        const nameInput =
            el("channelName");


        if (nameInput) {

            nameInput.value =
                channel?.name || "";

        }


        const descriptionInput =
            el("channelDescription");


        if (descriptionInput) {

            descriptionInput.value =
                channel?.description || "";

        }


        const privacy =
            channel

                ? (

                    channel.is_private === false
                        ? "public"
                        : "private"

                )

                : "private";


        const radio =
            document.querySelector(

                `input[name="channelPrivacy"][value="${privacy}"]`

            );


        if (radio) {

            radio.checked =
                true;

        }


        const imageInput =
            el("channelImage");


        if (imageInput) {

            imageInput.value =
                "";

        }


        const preview =
            el("channelImagePreview");


        if (preview) {

            if (
                channel?.image_url
            ) {

                preview.innerHTML = `

                    <img
                        src="${escapeAttribute(
                    channel.image_url
                )}"
                        alt=""
                    >

                `;

            } else {

                preview.innerHTML = `

                    <i data-lucide="hash"></i>

                `;

            }

        }


        let selectedIds =
            [];


        if (

            channel &&

            channel.is_private !== false

        ) {

            try {

                const members =
                    await channelAPI(

                        `/channels/${channel.id}/members`

                    );


                if (
                    Array.isArray(members)
                ) {

                    selectedIds =
                        members.map(
                            member =>
                                Number(
                                    member.id
                                )
                        );

                }

            } catch (error) {

                console.error(
                    "❌ LOAD CHANNEL MEMBERS:",
                    error
                );

            }

        }


        renderChannelUsers(
            selectedIds
        );


        updateMembersVisibility();


        refreshIcons();

    }


    // =====================================================
    // CLOSE CHANNEL MODAL
    // =====================================================

    function closeChannelModal() {

        const modal =
            el("channelModal");


        if (modal) {

            modal.classList.add(
                "hidden"
            );


            modal.style.display =
                "none";

        }


        const form =
            el("channelForm");


        if (form) {

            form.reset();

        }


        const id =
            el("channelId");


        if (id) {

            id.value =
                "";

        }


        const imageInput =
            el("channelImage");


        if (imageInput) {

            imageInput.value =
                "";

        }


        const preview =
            el("channelImagePreview");


        if (preview) {

            preview.innerHTML = `

                <i data-lucide="hash"></i>

            `;

        }


        const privateRadio =
            document.querySelector(

                'input[name="channelPrivacy"][value="private"]'

            );


        if (privateRadio) {

            privateRadio.checked =
                true;

        }


        ChannelsState.editingChannel =
            false;


        updateMembersVisibility();


        refreshIcons();

    }


    // =====================================================
    // IMAGE PREVIEW
    // =====================================================

    function previewChannelImage(
        event
    ) {

        const file =
            event.target.files?.[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showMessage(
                "اختر ملف صورة فقط."
            );


            event.target.value =
                "";


            return;

        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showMessage(
                "حجم الصورة يجب ألا يتجاوز 5MB.",
                "warning"
            );


            event.target.value =
                "";


            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            () => {

                const preview =
                    el("channelImagePreview");


                if (!preview) {

                    return;

                }


                preview.innerHTML = `

                    <img
                        src="${reader.result}"
                        alt=""
                    >

                `;

            };


        reader.readAsDataURL(
            file
        );

    }


    // =====================================================
    // UPLOAD CHANNEL IMAGE
    // =====================================================

    async function uploadChannelImage(
        file
    ) {

        if (!file) {

            return null;

        }


        const formData =
            new FormData();


        formData.append(
            "channelImage",
            file
        );


        const response =
            await fetch(

                "/channels/upload-image",

                {

                    method:
                        "POST",

                    credentials:
                        "include",

                    body:
                        formData

                }

            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch {

            data =
                null;

        }


        if (!response.ok) {

            throw new Error(

                data?.message ||
                "فشل رفع الصورة."

            );

        }


        if (!data?.image_url) {

            throw new Error(
                "السيرفر لم يرجع رابط الصورة."
            );

        }


        return data.image_url;

    }


    // =====================================================
    // SAVE CHANNEL
    // =====================================================

    async function saveChannel(
        event
    ) {

        event.preventDefault();


        const id =
            el("channelId")
                ?.value
                ?.trim();


        const name =
            el("channelName")
                ?.value
                ?.trim();


        const description =
            el("channelDescription")
                ?.value
                ?.trim();


        const selectedPrivacy =
            document.querySelector(

                'input[name="channelPrivacy"]:checked'

            );


        const isPrivate =
            selectedPrivacy?.value ===
            "private";


        if (!name) {

            showMessage(
                "اكتب اسم القناة.",
                "warning"
            );

            return;

        }


        let members =
            [];


        if (isPrivate) {

            members = [

                ...document.querySelectorAll(

                    "#channelUsers input[type='checkbox']:checked"

                )

            ]

                .map(
                    input =>
                        Number(
                            input.value
                        )
                )

                .filter(
                    userId =>
                        Number.isFinite(
                            userId
                        )
                );

        }


        const file =
            el("channelImage")
                ?.files?.[0];


        try {

            let imageUrl =
                null;


            if (

                ChannelsState.editingChannel &&

                id

            ) {

                const existingChannel =
                    ChannelsState.channels.find(

                        channel =>
                            Number(
                                channel.id
                            ) ===
                            Number(id)

                    );


                imageUrl =
                    existingChannel
                        ?.image_url ||

                    ChannelsState
                        .currentChannel
                        ?.image_url ||

                    null;

            }


            if (file) {

                imageUrl =
                    await uploadChannelImage(
                        file
                    );

            }


            const body = {

                name,

                description,

                image_url:
                    imageUrl,

                is_private:
                    isPrivate,

                members:
                    isPrivate
                        ? members
                        : []

            };


            const endpoint =
                id
                    ? `/channels/${id}`
                    : "/channels";


            const method =
                id
                    ? "PUT"
                    : "POST";


            const data =
                await channelAPI(

                    endpoint,

                    {

                        method,

                        body:
                            JSON.stringify(
                                body
                            )

                    }

                );


            closeChannelModal();


            await loadChannels();


            if (id) {

                await openChannel(
                    id
                );

            } else if (
                data?.channel?.id
            ) {

                await openChannel(
                    data.channel.id
                );

            } else if (
                data?.id
            ) {

                await openChannel(
                    data.id
                );

            }

        } catch (error) {




            showMessage(
                error.message ||
                "حدث خطأ أثناء حفظ القناة.",
                "error"
            );

        }

    }


    // =====================================================
    // DELETE CHANNEL MODAL
    // =====================================================

    function openDeleteChannelModal() {

        const channel =
            ChannelsState.currentChannel;


        if (!channel) {

            showMessage(
                "حدد قناة أولاً.",
                "error"
            );


            return;

        }


        const channelId =
            Number(channel.id);


        if (

            !Number.isFinite(channelId) ||

            channelId <= 0

        ) {

            showMessage(
                "رقم القناة غير صحيح.",
                "error"
            );


            return;

        }


        const modal =
            el("deleteChannelModal");


        const name =
            el("deleteChannelName");


        if (!modal) {

            showMessage(
                "عنصر حذف القناة غير موجود في HTML.",
                "error"
            );


            return;

        }


        if (name) {

            name.textContent =
                channel.name ||
                "هذه القناة";

        }


        ChannelsState.deleteModalOpen =
            true;


        modal.classList.remove(
            "hidden"
        );


        modal.style.display =
            "flex";


        modal.style.visibility =
            "visible";


        modal.style.opacity =
            "1";


        modal.style.pointerEvents =
            "auto";


        modal.style.zIndex =
            "999999";


        document.body.style.overflow =
            "hidden";


        refreshIcons();

    }


    // =====================================================
    // CLOSE DELETE CHANNEL MODAL
    // =====================================================

    function closeDeleteChannelModal() {

        const modal =
            el("deleteChannelModal");


        if (modal) {

            modal.classList.add(
                "hidden"
            );


            modal.style.display =
                "none";


            modal.style.visibility =
                "hidden";


            modal.style.opacity =
                "0";


            modal.style.pointerEvents =
                "none";

        }


        ChannelsState.deleteModalOpen =
            false;


        document.body.style.overflow =
            "";


        const button =
            el("confirmDeleteChannelBtn");


        if (button) {

            button.classList.remove(
                "loading"
            );


            button.disabled =
                false;


            button.innerHTML = `

                <i data-lucide="trash-2"></i>

                حذف القناة

            `;

        }


        refreshIcons();

    }


    // =====================================================
    // CONFIRM DELETE CHANNEL
    // =====================================================

    async function confirmDeleteChannel() {

        const channel =
            ChannelsState.currentChannel;


        if (!channel) {

            closeDeleteChannelModal();

            return;

        }


        const channelId =
            Number(channel.id);


        if (

            !Number.isFinite(channelId) ||

            channelId <= 0

        ) {

            showMessage(
                "رقم القناة غير صحيح.",
                "error"
            );


            return;

        }


        const button =
            el("confirmDeleteChannelBtn");


        if (
            button?.disabled
        ) {

            return;

        }


        if (button) {

            button.classList.add(
                "loading"
            );


            button.disabled =
                true;


            button.innerHTML = `

                <i data-lucide="loader-2"></i>

                جاري الحذف...

            `;


            refreshIcons();

        }


        try {

            const result =
                await channelAPI(

                    `/channels/${channelId}`,

                    {

                        method:
                            "DELETE"

                    }

                );



            stopMessagePolling();


            ChannelsState.channels =
                ChannelsState.channels.filter(

                    item =>
                        Number(
                            item.id
                        ) !==
                        channelId

                );


            ChannelsState.currentChannel =
                null;


            ChannelsState.messages =
                [];


            ChannelsState.lastMessageId =
                null;


            ChannelsState.lastMessagesSignature =
                null;


            closeDeleteChannelModal();


            closeEmojiPicker();


            el("channelChat")
                ?.classList
                .add("hidden");


            el("channelEmpty")
                ?.classList
                .remove("hidden");


            const headerName =
                el("channelHeaderName");


            if (headerName) {

                headerName.textContent =
                    "";

            }


            const headerDescription =
                el("channelHeaderDescription");


            if (headerDescription) {

                headerDescription.textContent =
                    "";

            }


            const headerImage =
                el("channelHeaderImage");


            if (headerImage) {

                headerImage.innerHTML =
                    "";

            }


            renderChannels();


            await loadChannels();

        } catch (error) {

            console.error(
                "❌ DELETE CHANNEL ERROR:",
                error
            );


            showMessage(
                error?.message ||
                "فشل حذف القناة.",
                "error"
            );


            if (button) {

                button.classList.remove(
                    "loading"
                );


                button.disabled =
                    false;


                button.innerHTML = `

                    <i data-lucide="trash-2"></i>

                    حذف القناة

                `;


                refreshIcons();

            }

        }

    }


    // =====================================================
    // MEMBERS MODAL
    // =====================================================

    async function openMembersModal() {

        const channel =
            ChannelsState.currentChannel;


        if (!channel) {

            showMessage(
                "حدد قناة أولاً.",
                "warning"
            );


            return;

        }


        const modal =
            el("membersModal");


        const container =
            el("channelMembersList");


        if (!modal || !container) {

            console.error(
                "❌ Members modal elements missing"
            );


            return;

        }


        modal.classList.remove(
            "hidden"
        );


        modal.style.display =
            "flex";


        container.innerHTML = `

            <div class="channels-loading">

                جاري تحميل الأعضاء...

            </div>

        `;


        try {

            if (
                channel.is_private === false
            ) {

                container.innerHTML = `

                    <div class="channels-loading">

                        <i data-lucide="globe"></i>

                        <br><br>

                        هذه قناة عامة

                        <br>

                        جميع أعضاء النظام يمكنهم الوصول إليها

                    </div>

                `;


                refreshIcons();


                return;

            }


            const members =
                await channelAPI(

                    `/channels/${channel.id}/members`

                );


            if (

                !Array.isArray(members) ||

                !members.length

            ) {

                container.innerHTML = `

                    <div class="channels-loading">

                        لا يوجد أعضاء

                    </div>

                `;


                return;

            }


            container.innerHTML =
                members
                    .map(member => {

                        const username =
                            member.username ||
                            "مستخدم";


                        return `

                            <div
                                class="channel-member-row"
                            >

                                <div
                                    class="channel-member-row-info"
                                >

                                    <strong>

                                        ${escapeHTML(
                            username
                        )}

                                    </strong>

                                    <span>

                                        ${escapeHTML(
                            member.role ||
                            "member"
                        )}

                                    </span>

                                </div>

                            </div>

                        `;

                    })
                    .join("");


        } catch (error) {

            console.error(
                "❌ MEMBERS MODAL ERROR:",
                error
            );


            container.innerHTML = `

                <div class="channels-loading">

                    فشل تحميل الأعضاء

                    <br><br>

                    <small>

                        ${escapeHTML(
                error.message
            )}

                    </small>

                </div>

            `;

        }

    }


    // =====================================================
    // POLLING
    // =====================================================

    function startMessagePolling() {

        stopMessagePolling();


        const channel =
            ChannelsState.currentChannel;


        if (!channel) {

            return;

        }


        const channelId =
            Number(channel.id);


        if (
            !Number.isFinite(channelId)
        ) {

            return;

        }


        ChannelsState.pollingChannelId =
            channelId;


        ChannelsState.pollingRequestRunning =
            false;


        ChannelsState.polling =
            setInterval(
                async () => {

                    if (

                        !ChannelsState.currentChannel ||

                        Number(
                            ChannelsState
                                .currentChannel
                                .id
                        ) !==
                        channelId

                    ) {

                        stopMessagePolling();

                        return;

                    }


                    if (
                        ChannelsState
                            .pollingRequestRunning
                    ) {

                        return;

                    }


                    ChannelsState
                        .pollingRequestRunning =
                        true;


                    try {

                        await loadChannelMessages(

                            channelId,

                            true

                        );

                    } finally {

                        ChannelsState
                            .pollingRequestRunning =
                            false;

                    }

                },

                5000

            );


    }


    // =====================================================
    // STOP POLLING
    // =====================================================

    function stopMessagePolling() {

        if (
            ChannelsState.polling
        ) {

            clearInterval(
                ChannelsState.polling
            );


            ChannelsState.polling =
                null;

        }


        ChannelsState.pollingChannelId =
            null;


        ChannelsState.pollingRequestRunning =
            false;

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /[&<>"']/g,
                char => ({

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                })[char]
            );

    }


    // =====================================================
    // ESCAPE ATTRIBUTE
    // =====================================================

    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );

    }


    // =====================================================
    // LUCIDE
    // =====================================================

    function refreshIcons() {

        if (
            typeof lucide !==
            "undefined"
        ) {

            try {

                lucide.createIcons();

            } catch (error) {

                console.warn(
                    "Lucide error:",
                    error
                );

            }

        }

    }


    // =====================================================
    // CURRENT USER ID
    // =====================================================

    function getCurrentUserId() {

        const user =
            window.currentUser;


        if (user?.id) {

            return Number(
                user.id
            );

        }


        return 0;

    }


    // =====================================================
    // DEBUG API
    // =====================================================

    window.TrillChannels = {

        state:
            ChannelsState,

        loadChannels,

        loadUsers,

        openChannel,

        openChannelModal,

        closeChannelModal,

        openDeleteChannelModal,

        closeDeleteChannelModal,

        confirmDeleteChannel,

        openMembersModal,

        sendChannelMessage,

        editChannelMessage,

        deleteChannelMessage,

        togglePinMessage,

        startMessagePolling,

        stopMessagePolling,

        renderMessages,

        // Attachment API

        clearAttachments,

        renderAttachmentPreview,

        setupAttachmentSystem,

        // Emoji API

        setupEmojiPicker,

        toggleEmojiPicker,

        closeEmojiPicker,

        insertEmoji,

        renderEmojiGrid

    };


    // =====================================================
    // GLOBAL INSTANCE
    // =====================================================

    window[GLOBAL_KEY] = {

        state:
            ChannelsState,

        initialized:
            ChannelsState.initialized,

        stopPolling:
            stopMessagePolling

    };



})();
