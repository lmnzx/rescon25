const paragraphs = [
	"the quick brown fox jumps over the lazy dog this pangram contains every letter of the english alphabet at least once pangrams are often used to test fonts keyboards and other text related tools they are also useful for typing practice and speed tests",
	"programming is the process of creating a set of instructions that tell a computer how to perform a task programming can be done using a variety of computer programming languages such as javascript python and c",
	"the internet is a global network of billions of computers and other electronic devices with the internet it is possible to access almost any information communicate with anyone else in the world and do much more you can do all this by connecting a computer to the internet which is also called going online",
	"artificial intelligence is intelligence demonstrated by machines as opposed to natural intelligence displayed by animals including humans leading ai textbooks define the field as the study of intelligent agents any system that perceives its environment and takes actions that maximize its chance of achieving its goals",
	"typing speed is typically measured in words per minute the average typing speed is around 40 wpm with professional typists reaching speeds of 65 to 75 wpm the world record for typing speed is over 200 wpm achieved on a standard qwerty keyboard",
	"cloud computing is the on demand availability of computer system resources especially data storage and computing power without direct active management by the user the term is generally used to describe data centers available to many users over the internet",
	"cybersecurity is the practice of protecting systems networks and programs from digital attacks these cyberattacks are usually aimed at accessing changing or destroying sensitive information extorting money from users or interrupting normal business processes",
	"machine learning is a method of data analysis that automates analytical model building it is a branch of artificial intelligence based on the idea that systems can learn from data identify patterns and make decisions with minimal human intervention",
	"the world wide web commonly known as the web is an information system where documents and other web resources are identified by uniform resource locators which may be interlinked by hypertext and are accessible over the internet",
	"software development is the process of conceiving specifying designing programming documenting testing and bug fixing involved in creating and maintaining applications frameworks or other software components",
];

export function generateText(): string {
	const randomIndex = Math.floor(Math.random() * paragraphs.length);
	return paragraphs[randomIndex];
}
